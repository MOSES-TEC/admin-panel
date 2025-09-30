// import axios from 'axios';

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     const { url } = req.body;
    
//     if (!url) {
//       return res.status(400).json({ message: 'URL is required' });
//     }

//     // Fetch the image using axios
//     const response = await axios.get(url, {
//       responseType: 'arraybuffer',
//       headers: {
//         'Accept': 'image/*',
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
//       }
//     });

//     // Get the content type from the response
//     const contentType = response.headers['content-type'];
    
//     // Set the appropriate headers
//     res.setHeader('Content-Type', contentType);
//     res.setHeader('Content-Length', response.data.length);
    
//     // Send the image data
//     res.send(response.data);
//   } catch (error) {
//     console.error('Error fetching image:', error);
//     res.status(500).json({ message: 'Failed to fetch image' });
//   }
// } 