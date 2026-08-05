from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health, name='health'),
    path('quran/surahs/', views.quran_surahs, name='quran-surahs'),
    path('quran/reciters/', views.quran_reciters, name='quran-reciters'),
    path('quran/audio/<str:reciter>/<str:surah_number>/<str:verse_number>.mp3', views.quran_audio_proxy, name='quran-audio-proxy'),
    path('quran/audio/check/<str:reciter>/<str:surah_number>/<str:verse_number>/', views.quran_audio_check, name='quran-audio-check'),
    path('quran/surah/<str:surah_number>/<str:language>/', views.quran_surah_detail, name='quran-surah-detail'),
    path('hadith/', views.hadith, name='hadith'),
    path('prayer-times/', views.prayer_times, name='prayer-times'),
    path('auth/status/', views.auth_status, name='auth-status'),
    path('auth/login/', views.auth_login, name='auth-login'),
    path('auth/register/', views.auth_register, name='auth-register'),
    path('auth/logout/', views.auth_logout, name='auth-logout'),
    path('chat/', views.chat, name='chat'),
    path('story/', views.story, name='story'),
]
