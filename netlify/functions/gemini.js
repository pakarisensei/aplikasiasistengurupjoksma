// Import 'fetch' jika Anda menggunakan versi Node.js yang lebih lama dari 18
// Di lingkungan Netlify Functions modern, 'fetch' sudah tersedia secara global.
// const fetch = require('node-fetch'); // Uncomment jika perlu

exports.handler = async (event) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Ambil 'prompt' dari body permintaan yang dikirim dari front-end
    const { prompt } = JSON.parse(event.body);

    // Ambil API Key dari environment variables di Netlify
    // Ini cara yang aman untuk menyimpan kunci rahasia
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API key untuk Gemini tidak diatur di environment variables.");
    }
    
    // URL endpoint API Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Siapkan payload sesuai format yang dibutuhkan Gemini API
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    // Lakukan panggilan ke Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Jika respons dari Gemini tidak OK, lemparkan error
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API merespons dengan status ${response.status}`);
    }

    // Ambil data JSON dari respons
    const result = await response.json();

    // Ekstrak teks yang dihasilkan dari respons
    const generatedText = result.candidates[0]?.content?.parts[0]?.text || "Maaf, tidak ada konten yang bisa dihasilkan.";

    // Kirim kembali teks yang berhasil dihasilkan ke front-end
    return {
      statusCode: 200,
      body: JSON.stringify({ text: generatedText }),
    };

  } catch (error) {
    // Tangani jika ada error selama proses
    console.error('Error di dalam Netlify Function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
