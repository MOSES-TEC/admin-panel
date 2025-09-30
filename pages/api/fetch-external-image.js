export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Fetch the image from the external URL
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the content type and buffer
    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    // Return the image data
    res.setHeader('Content-Type', contentType);
    res.status(200).json({
      success: true,
      data: Buffer.from(buffer).toString('base64'),
      contentType
    });
  } catch (error) {
    console.error('Error fetching external image:', error);
    res.status(500).json({ error: 'Failed to fetch external image' });
  }
} 