import json
from functools import lru_cache
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from io import BytesIO
from django.http import FileResponse, JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

OPENAI_API_KEY = getattr(settings, 'OPENAI_API_KEY', '')
OPENAI_CLIENT = OpenAI(api_key=OPENAI_API_KEY) if OpenAI and OPENAI_API_KEY else None


@lru_cache(maxsize=256)
def _fetch_json_cached(url, timeout):
    req = Request(url, headers={'User-Agent': 'Deen-Guide/1.0'})
    with urlopen(req, timeout=timeout) as response:
        return json.load(response)


def _fetch_json(url, timeout=2):
    return _fetch_json_cached(url, timeout)


def _safe_json_response(payload, status=200):
    return JsonResponse(payload, status=status, safe=not isinstance(payload, list))


def _extract_message_content(response_obj):
    """Robustly extract the assistant message content from various response shapes."""
    try:
        # Newer SDKs: response.choices[0].message.content
        return response_obj.choices[0].message.content
    except Exception:
        try:
            # Older or dict-like responses
            return response_obj['choices'][0]['message']['content']
        except Exception:
            return None


@require_GET
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'deen-guide-api'})


@require_GET
def quran_surahs(request):
    fallback = {
        'code': 200,
        'status': 'OK',
        'data': [
            {'number': 1, 'englishName': 'Al-Fatiha', 'name': 'الفاتحة'},
            {'number': 2, 'englishName': 'Al-Baqarah', 'name': 'البقرة'},
            {'number': 36, 'englishName': 'Ya-Sin', 'name': 'يس'},
        ],
    }
    try:
        data = _fetch_json('https://api.alquran.cloud/v1/surah', timeout=2)
        return JsonResponse(data)
    except (HTTPError, URLError, TimeoutError, ValueError):
        return JsonResponse(fallback)


@require_GET
def quran_reciters(request):
    fallback = {
        'code': 200,
        'status': 'OK',
        'data': [
            {'value': 'ar.alafasy', 'label': 'Mishary Alafasy'},
            {'value': 'ar.husary', 'label': 'Mohamed Siddiq Al-Husary'},
            {'value': 'ar.minshawi', 'label': 'Muhammad Siddiq Al-Minshawi'},
        ],
    }
    return JsonResponse(fallback)


@require_GET
def quran_surah_detail(request, surah_number, language='en.sahih'):
    fallback = {
        'code': 200,
        'status': 'OK',
        'data': {
            'number': int(surah_number),
            'englishName': 'Al-Fatiha',
            'name': 'الفاتحة',
            'ayahs': [
                {
                    'numberInSurah': 1,
                    'text': 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
                },
                {
                    'numberInSurah': 2,
                    'text': 'All praise is due to Allah, Lord of the worlds.',
                },
            ],
        },
    }
    try:
        url = f'https://api.alquran.cloud/v1/surah/{surah_number}/{language}'
        data = _fetch_json(url, timeout=2)
        return JsonResponse(data)
    except (HTTPError, URLError, TimeoutError, ValueError):
        return JsonResponse(fallback)


@require_GET
def quran_audio_proxy(request, reciter, surah_number, verse_number):
    # Try to fetch the audio server-side using a browser-like User-Agent
    # so the remote CDN is less likely to reject the request. If successful
    # return the bytes as a FileResponse (same-origin for the client, no CORS).
    candidates = [
        f'https://cdn.islamic.network/quran/audio/128/{reciter}/{surah_number}/{verse_number}.mp3',
        f'https://cdn.islamic.network/quran/audio/64/{reciter}/{surah_number}/{verse_number}.mp3',
    ]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
               'Referer': 'https://cdn.islamic.network/'}

    for source_url in candidates:
        try:
            req = Request(source_url, headers=headers)
            with urlopen(req, timeout=6) as response:
                data = response.read()
            resp = FileResponse(BytesIO(data), content_type='audio/mpeg')
            resp['Content-Disposition'] = 'inline; filename="quran-recitation.mp3"'
            resp['Cache-Control'] = 'public, max-age=86400'
            # Allow developer tools or other origins to fetch via the API proxy if needed
            resp['Access-Control-Allow-Origin'] = '*'
            return resp
        except HTTPError as he:
            # If the remote returns 403/404 for this candidate, try next
            continue
        except (URLError, TimeoutError, ValueError):
            continue

    return JsonResponse({'error': 'Recitation audio unavailable'}, status=502)


@require_GET
def quran_audio_check(request, reciter, surah_number, verse_number):
    # Server-side lightweight check to see if remote audio exists (avoids
    # triggering CORS errors in the browser). Returns 204 if available,
    # otherwise 404 or 502.
    candidates = [
        f'https://cdn.islamic.network/quran/audio/128/{reciter}/{surah_number}/{verse_number}.mp3',
        f'https://cdn.islamic.network/quran/audio/64/{reciter}/{surah_number}/{verse_number}.mp3',
    ]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'}
    for url in candidates:
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=6) as resp:
                status = getattr(resp, 'status', None) or getattr(resp, 'getcode', lambda: None)()
                if status and 200 <= int(status) < 300:
                    return JsonResponse({'available': True}, status=200)
        except HTTPError:
            continue
        except (URLError, TimeoutError, ValueError):
            continue
    return JsonResponse({'available': False}, status=404)


@require_GET
def hadith(request):
    collection = request.GET.get('collection', 'bukhari')
    language = request.GET.get('language', 'eng')
    fallback_hadiths = [
        {
            'hadithnumber': 1,
            'text': 'The Messenger of Allah said: “Whoever does not show mercy to others will not be shown mercy.”',
            'narrator': 'Sahih al-Bukhari',
        },
        {
            'hadithnumber': 2,
            'text': 'The Messenger of Allah said: “Allah is kind and loves kindness in all things.”',
            'narrator': 'Sahih Muslim',
        },
    ]

    try:
        url = f'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{collection}.json'
        data = _fetch_json(url)
        hadiths = data.get('hadiths', []) if isinstance(data, dict) else []
        if hadiths:
            return JsonResponse({'hadiths': hadiths, 'collection': collection, 'language': language})
    except (HTTPError, URLError, TimeoutError, ValueError):
        pass

    return JsonResponse({'hadiths': fallback_hadiths, 'collection': collection, 'language': language})


@require_GET
def prayer_times(request):
    latitude = request.GET.get('latitude')
    longitude = request.GET.get('longitude')
    method = request.GET.get('method', '4')

    fallback = {
        'code': 200,
        'status': 'OK',
        'data': {
            'timings': {
                'Fajr': '05:00',
                'Sunrise': '06:20',
                'Dhuhr': '12:10',
                'Asr': '15:35',
                'Maghrib': '18:00',
                'Isha': '19:20',
            },
            'date': {
                'gregorian': {'date': '01-01-2025', 'month': {'number': 1, 'en': 'January'}, 'year': '2025'},
                'hijri': {'date': '19-06-1446', 'month': {'number': 6, 'en': 'Dhu al-Qadah'}, 'year': '1446'},
            },
        },
    }

    if not latitude or not longitude:
        return JsonResponse({'error': 'latitude and longitude are required'}, status=400)

    try:
        query = urlencode({'latitude': latitude, 'longitude': longitude, 'method': method})
        data = _fetch_json(f'https://api.aladhan.com/v1/timings?{query}')
        return JsonResponse(data)
    except (HTTPError, URLError, TimeoutError, ValueError):
        return JsonResponse(fallback)


@require_GET
def auth_status(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'username': request.user.username,
            'email': request.user.email or '',
        })
    return JsonResponse({'authenticated': False})


@csrf_exempt
@require_POST
def auth_login(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    if not username or not password:
        return JsonResponse({'error': 'Username and password are required.'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid username or password.'}, status=401)

    login(request, user)
    return JsonResponse({'authenticated': True, 'username': user.username, 'email': user.email or ''})

@csrf_exempt
@require_POST
def auth_register(request):
    print("REGISTER CALLED")
    print("REQUEST BODY:", request.body)

    try:
        data = json.loads(request.body.decode("utf-8"))

        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip()
        password = (data.get("password") or "").strip()
        password_confirm = (data.get("passwordConfirm") or "").strip()

        if not username or not email or not password or not password_confirm:
            return JsonResponse(
                {
                    "error": "Username, email, password, and password confirmation are required."
                },
                status=400,
            )

        if password != password_confirm:
            return JsonResponse(
                {"error": "Passwords do not match."},
                status=400,
            )

        if len(password) < 8:
            return JsonResponse(
                {"error": "Password must be at least 8 characters."},
                status=400,
            )

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"error": "Username is already taken."},
                status=409,
            )

        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"error": "Email is already in use."},
                status=409,
            )

        print("ABOUT TO CREATE USER")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        print("USER CREATED:", user.username)

        login(request, user)

        print("LOGIN SUCCESSFUL")

        return JsonResponse(
            {
                "authenticated": True,
                "username": user.username,
                "email": user.email,
            }
        )

    except Exception as exc:
        import traceback

        print("REGISTER ERROR:", repr(exc))
        traceback.print_exc()

        return JsonResponse(
            {"error": f"Registration failed: {str(exc)}"},
            status=500,
        )
@csrf_exempt
@require_POST
def auth_logout(request):
    if request.user.is_authenticated:
        logout(request)
    return JsonResponse({'authenticated': False})


@csrf_exempt
@require_POST
def chat(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    message = data.get('message', '').strip()
    if not message:
        return JsonResponse({'error': 'No message provided'}, status=400)

    if not OPENAI_CLIENT:
        demo_reply = "(Demo) This is a demo assistant reply. Set OPENAI_API_KEY to enable live responses."
        return JsonResponse({'reply': demo_reply})

    try:
        response = OPENAI_CLIENT.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'You are a helpful assistant. Be concise, friendly, and respectful.'},
                {'role': 'user', 'content': message},
            ],
            max_tokens=500,
        )
        bot_reply = _extract_message_content(response) or ''
        return JsonResponse({'reply': bot_reply})
    except Exception as exc:
        return JsonResponse({'error': str(exc)}, status=500)


@csrf_exempt
@require_POST
def story(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    prophet = (data.get('prophet') or '').strip()
    if not prophet:
        return JsonResponse({'error': 'No prophet name provided'}, status=400)

    prompt = (
        f"Write a respectful, accurate, and concise full story of the life and key events "
        f"of the Prophet {prophet}. Rely on widely accepted accounts, avoid inventing unauthenticated "
        "details or speculative claims, and present lessons and an appropriate summary at the end. "
        "Keep the tone educational and suitable for a general audience."
    )

    if not OPENAI_CLIENT:
        demo = (
            f"(Demo) Story of Prophet {prophet}:\n"
            "He taught patience, trust in Allah, and steadfastness in worship. "
            "This short demo is for local testing — set OPENAI_API_KEY to generate full stories."
        )
        return JsonResponse({'story': demo})

    try:
        response = OPENAI_CLIENT.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'You are a helpful, respectful assistant who writes clear educational summaries.'},
                {'role': 'user', 'content': prompt},
            ],
            max_tokens=900,
            temperature=0.7,
        )
        story_text = _extract_message_content(response) or ''
        return JsonResponse({'story': story_text})
    except Exception as exc:
        return JsonResponse({'error': str(exc)}, status=500)
