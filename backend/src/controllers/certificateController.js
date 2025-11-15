const { validationResult } = require('express-validator');

const issueCertificate = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.certificate) {
      return res.status(400).json({ 
        success: false, 
        error: 'No certificate file uploaded' 
      });
    }

    const { companyName } = req.body;
    const certificateFile = req.files.certificate;

    // Validate company name
    if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid company name is required' 
      });
    }

    // Process the file and issue certificate
    console.log('File received - Name:', certificateFile.name, 'Size:', certificateFile.size, 'bytes');
    console.log('File data length:', certificateFile.data.length, 'bytes');

    // Use the raw uploaded file bytes for hashing to ensure unique hashes per content
    const fileBuffer = Buffer.isBuffer(certificateFile.data)
      ? certificateFile.data
      : Buffer.from(certificateFile.data);

    // Debug: preview first/last bytes to confirm different files differ
    console.log('First 16 bytes:', fileBuffer.slice(0, 16).toString('hex'));
    console.log('Last 16 bytes:', fileBuffer.slice(Math.max(0, fileBuffer.length - 16)).toString('hex'));

    const result = await req.blockchain.issueCertificate({
      fileBuffer,
      companyName: companyName.trim()
    });

    console.log('Certificate issued with hash:', result.block.data.certificate_hash);

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: result.block
    });
  } catch (error) {
    console.error('Error in issueCertificate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to issue certificate',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyCertificate = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.certificate) {
      return res.status(400).json({ 
        success: false, 
        error: 'No certificate file provided for verification' 
      });
    }

    const certificateFile = req.files.certificate;

    console.log('Verifying file - Name:', certificateFile.name, 'Size:', certificateFile.size, 'bytes');
    console.log('File data length:', certificateFile.data.length, 'bytes');

    // Use the raw uploaded file bytes for verification
    const bufferToVerify = Buffer.isBuffer(certificateFile.data)
      ? certificateFile.data
      : Buffer.from(certificateFile.data);

    // Debug: preview first/last bytes to confirm content used for verification
    console.log('Verify first 16 bytes:', bufferToVerify.slice(0, 16).toString('hex'));
    console.log('Verify last 16 bytes:', bufferToVerify.slice(Math.max(0, bufferToVerify.length - 16)).toString('hex'));

    // Verify the certificate with the same hashing logic
    const result = await req.blockchain.verifyCertificate(bufferToVerify);
    
    console.log('Verification result:', result.valid ? 'VALID' : 'INVALID');

    if (result.valid) {
      return res.status(200).json({
        success: true,
        message: 'Certificate is valid',
        data: {
          valid: true,
          ...result.block
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Certificate not found in the blockchain',
        data: { valid: false }
      });
    }
  } catch (error) {
    console.error('Error in verifyCertificate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify certificate',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getBlockchain = (req, res, next) => {
  try {
    const chain = req.blockchain.getBlockchain();
    res.status(200).json({
      success: true,
      data: chain
    });
  } catch (error) {
    console.error('Error in getBlockchain:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve blockchain',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  issueCertificate,
  verifyCertificate,
  getBlockchain
};
