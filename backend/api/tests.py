import json

from django.test import TestCase


class ApiEndpointsTests(TestCase):
    def test_quran_surahs_endpoint(self):
        response = self.client.get('/api/quran/surahs/')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('data', data)
        self.assertTrue(data['data'])

    def test_quran_surah_detail_endpoint(self):
        response = self.client.get('/api/quran/surah/1/en.sahih/')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('data', data)
        self.assertEqual(data['data']['number'], 1)
        self.assertTrue(data['data']['ayahs'])

    def test_quran_reciters_endpoint(self):
        response = self.client.get('/api/quran/reciters/')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('data', data)
        self.assertTrue(data['data'])

    def test_hadith_endpoint(self):
        response = self.client.get('/api/hadith/', {'collection': 'bukhari', 'language': 'eng'})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('hadiths', data)
        self.assertTrue(data['hadiths'])

    def test_prayer_times_endpoint(self):
        response = self.client.get('/api/prayer-times/', {'latitude': '21.4225', 'longitude': '39.8262', 'method': '4'})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('data', data)
        self.assertIn('timings', data['data'])

    def test_auth_register_and_login(self):
        register_url = '/api/auth/register/'
        login_url = '/api/auth/login/'
        logout_url = '/api/auth/logout/'
        status_url = '/api/auth/status/'

        response = self.client.post(
            register_url,
            data=json.dumps({
                'username': 'testuser',
                'password': 'Testpass123',
                'passwordConfirm': 'Testpass123',
            }),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['authenticated'], True)

        response = self.client.get(status_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['authenticated'], True)
        self.assertEqual(response.json()['username'], 'testuser')

        response = self.client.post(logout_url, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['authenticated'], False)

        response = self.client.post(
            login_url,
            data=json.dumps({
                'username': 'testuser',
                'password': 'Testpass123',
            }),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['authenticated'], True)
        self.assertEqual(response.json()['username'], 'testuser')
