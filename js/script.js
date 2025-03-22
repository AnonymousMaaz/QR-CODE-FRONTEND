document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('qrForm');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('resultContainer');
    const qrCodeImg = document.getElementById('qrCodeImg');
    const downloadLink = document.getElementById('downloadLink');
    const downloadSvgLink = document.getElementById('downloadSvgLink');
    const errorMessage = document.getElementById('errorMessage');
    const useExternalApiCheckbox = document.getElementById('useExternalApi');
    const logoUpload = document.getElementById('logoUpload');
    const logoUploadBtn = document.getElementById('logoUploadBtn');
    const logoPreview = document.getElementById('logoPreview');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    
    let selectedStyle = 'standard';
    let logoData = null;
    
    // Style selection
    const styleOptions = document.querySelectorAll('.qr-style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', function() {
            styleOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedStyle = this.getAttribute('data-style');
        });
    });
    
    // Logo upload handling
    logoUploadBtn.addEventListener('click', function() {
        logoUpload.click();
    });
    
    logoUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                logoData = event.target.result;
                logoPreview.src = logoData;
                logoPreview.style.display = 'block';
                removeLogoBtn.style.display = 'block';
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    removeLogoBtn.addEventListener('click', function() {
        logoData = null;
        logoPreview.src = '';
        logoPreview.style.display = 'none';
        logoUpload.value = '';
        removeLogoBtn.style.display = 'none';
    });
    
    // Test if the server is running
    const testServerConnection = async () => {
        try {
            const response = await fetch('http://localhost:5000/', {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            
            if (response.ok) {
                console.log('Server is running');
                return true;
            } else {
                console.log('Server returned an error');
                return false;
            }
        } catch (error) {
            console.error('Server connection error:', error);
            return false;
        }
    };
    
    // Check server connection on page load
    testServerConnection().then(isConnected => {
        if (!isConnected) {
            errorMessage.textContent = 'Unable to connect to the local server. Check if it\'s running or use the public API option.';
            errorMessage.style.display = 'block';
            useExternalApiCheckbox.checked = true;
        }
    });
    
    // Function to apply QR style based on selection
    const applyQrStyle = (baseUrl, params) => {
        // Base parameters for all styles
        const baseParams = new URLSearchParams(params);
        
        switch (selectedStyle) {
            case 'rounded':
                baseParams.append('format', 'svg');
                baseParams.append('qzone', '1');
                baseParams.append('format', 'svg');
                // For rounded corners, we'd use SVG for more control
                return `${baseUrl}?${baseParams.toString()}`;
                
            case 'dot':
                baseParams.append('format', 'svg');
                baseParams.append('qzone', '2');
                // For dot style, we'd ideally use a specialized API or custom rendering
                return `${baseUrl}?${baseParams.toString()}`;
                
            case 'custom':
                baseParams.append('format', 'svg');
                baseParams.append('qzone', '1');
                // Custom style with more gradients or patterns
                return `${baseUrl}?${baseParams.toString()}`;
                
            case 'standard':
            default:
                return `${baseUrl}?${baseParams.toString()}`;
        }
    };
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const data = document.getElementById('qrData').value;
        const size = document.getElementById('qrSize').value;
        const color = document.getElementById('qrColor').value.substring(1); // Remove #
        const bgColor = document.getElementById('qrBgColor').value.substring(1); // Remove #
        
        // Hide any previous error messages
        errorMessage.style.display = 'none';
        
        // Show loader
        loader.style.display = 'block';
        resultContainer.style.display = 'none';
        
        // Check if using external API
        const useExternalApi = useExternalApiCheckbox.checked;
        
        if (useExternalApi) {
            // Use external QR code API with style parameters
            const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';
            const params = {
                data: encodeURIComponent(data),
                size: `${size}x${size}`,
                color: color,
                bgcolor: bgColor
            };
            
            const qrUrl = applyQrStyle(baseUrl, params);
            
            qrCodeImg.onload = function() {
                loader.style.display = 'none';
                resultContainer.style.display = 'block';
            };
            
            qrCodeImg.onerror = function() {
                loader.style.display = 'none';
                errorMessage.textContent = 'Error generating QR code with external API. Please try again.';
                errorMessage.style.display = 'block';
            };
            
            // Update the QR code image
            qrCodeImg.src = qrUrl;
            
            // Set download links
            downloadLink.href = qrUrl;
            downloadLink.setAttribute('download', 'beautiful_qrcode.png');
            
            // For SVG download (if style supports it)
            const svgUrl = `${baseUrl}?${new URLSearchParams({...params, format: 'svg'}).toString()}`;
            downloadSvgLink.href = svgUrl;
            downloadSvgLink.setAttribute('download', 'beautiful_qrcode.svg');
            
        } else {
            // Use local server API with extended parameters for styles
            try {
                const requestData = {
                    data: data,
                    size: size,
                    color: color,
                    bgColor: bgColor,
                    style: selectedStyle
                };
                
                // Add logo if present
                if (logoData) {
                    requestData.logo = logoData;
                }
                
                const response = await fetch('http://localhost:5000/generate-qr', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    throw new Error('Server returned an error');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    // Update the QR code image with the base64 data
                    qrCodeImg.src = result.image;
                    
                    // Set up download event for PNG
                    downloadLink.onclick = async function(e) {
                        e.preventDefault();
                        
                        try {
                            const response = await fetch('http://localhost:5000/download-qr', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestData)
                            });
                            
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.style.display = 'none';
                            a.href = url;
                            a.download = 'beautiful_qrcode.png';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        } catch (error) {
                            console.error('Error downloading QR code:', error);
                            errorMessage.textContent = 'Error downloading QR code. Please try again.';
                            errorMessage.style.display = 'block';
                        }
                    };
                    
                    // Set up download event for SVG (if supported by server)
                    downloadSvgLink.onclick = async function(e) {
                        e.preventDefault();
                        
                        try {
                            // Add format parameter for SVG
                            const svgRequestData = {...requestData, format: 'svg'};
                            
                            const response = await fetch('http://localhost:5000/download-qr', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(svgRequestData)
                            });
                            
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.style.display = 'none';
                            a.href = url;
                            a.download = 'beautiful_qrcode.svg';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        } catch (error) {
                            console.error('Error downloading SVG QR code:', error);
                            errorMessage.textContent = 'SVG format may not be supported. Please try PNG download.';
                            errorMessage.style.display = 'block';
                        }
                    };
                    
                    // Hide loader and show result
                    loader.style.display = 'none';
                    resultContainer.style.display = 'block';
                } else {
                    throw new Error('Server returned unsuccessful response');
                }
            } catch (error) {
                console.error('Error:', error);
                loader.style.display = 'none';
                errorMessage.textContent = 'Error connecting to server. Please try the public API option or check if the server is running.';
                errorMessage.style.display = 'block';
                useExternalApiCheckbox.checked = true;
                
                // Fall back to external API
                const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';
                const params = {
                    data: encodeURIComponent(data),
                    size: `${size}x${size}`,
                    color: color,
                    bgcolor: bgColor
                };
                
                const qrUrl = applyQrStyle(baseUrl, params);
                qrCodeImg.src = qrUrl;
                downloadLink.href = qrUrl;
                downloadLink.setAttribute('download', 'beautiful_qrcode.png');
                
                const svgUrl = `${baseUrl}?${new URLSearchParams({...params, format: 'svg'}).toString()}`;
                downloadSvgLink.href = svgUrl;
                downloadSvgLink.setAttribute('download', 'beautiful_qrcode.svg');
                
                // Show result anyway with external API result
                loader.style.display = 'none';
                resultContainer.style.display = 'block';
            }
        }
    });
});