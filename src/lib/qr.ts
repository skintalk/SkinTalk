import jsQR from 'jsqr';

export async function readQRFromFile(file: File): Promise<string | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 1000;
                let width = img.width;
                let height = img.height;

                // Resize if too large
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    resolve(null);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let code = jsQR(imageData.data, imageData.width, imageData.height);

                // Fallback: Grayscale if first attempt fails
                if (!code) {
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = gray;
                        data[i + 1] = gray;
                        data[i + 2] = gray;
                    }
                    ctx.putImageData(imageData, 0, 0);
                    code = jsQR(data, imageData.width, imageData.height);
                }

                // Second Fallback: Binary (thresholding) if grayscale also fails
                if (!code) {
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        const v = gray > 180 ? 255 : 0; // High threshold to isolate black QR on white
                        data[i] = v;
                        data[i + 1] = v;
                        data[i + 2] = v;
                    }
                    ctx.putImageData(imageData, 0, 0);
                    code = jsQR(data, imageData.width, imageData.height);
                }

                resolve(code ? code.data : null);
            };
            img.onerror = () => resolve(null);
            img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}
