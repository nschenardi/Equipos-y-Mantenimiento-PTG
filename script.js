document.addEventListener('DOMContentLoaded', () => {
    const equipmentType = document.getElementById('equipment-type');
    const generalFields = document.getElementById('general-fields');
    const tanksFields = document.getElementById('tanks-fields');
    const generateReportBtn = document.getElementById('generate-report');
    const photosInput = document.getElementById('photos');
    const datetimeInput = document.getElementById('datetime');

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const datetimeString = `${day}/${month}/${year} ${hours}:${minutes}`;
    datetimeInput.value = datetimeString;

    equipmentType.addEventListener('change', () => {
        if (equipmentType.value === 'Tanques') {
            generalFields.style.display = 'none';
            tanksFields.style.display = 'block';
        } else {
            generalFields.style.display = 'block';
            tanksFields.style.display = 'none';
        }
    });

    photosInput.addEventListener('change', () => {
        if (photosInput.files.length > 3) {
            alert('Máximo 3 fotografías');
            photosInput.value = '';
        }
    });

    async function getOrientedImageData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = async () => {
                    const orientation = await getOrientation(file);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width, height = img.height;

                    if (orientation > 4) {
                        canvas.width = height;
                        canvas.height = width;
                    } else {
                        canvas.width = width;
                        canvas.height = height;
                    }

                    switch (orientation) {
                        case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
                        case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
                        case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
                        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                        case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
                        case 7: ctx.transform(0, -1, -1, 0, height, width); break;
                        case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
                    }

                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                };
                img.onerror = () => reject(new Error('Error al cargar la imagen'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }

    function getOrientation(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => {
                const view = new DataView(e.target.result);
                if (view.getUint16(0, false) !== 0xFFD8) return resolve(-2);
                const length = view.byteLength;
                let offset = 2;
                while (offset < length) {
                    const marker = view.getUint16(offset, false);
                    offset += 2;
                    if (marker === 0xFFE1) {
                        if (view.getUint32(offset += 2, false) !== 0x45786966) return resolve(-1);
                        const littleEndian = view.getUint16(offset + 6, false) === 0x4949;
                        offset += view.getUint32(offset + 10, littleEndian);
                        const tags = view.getUint16(offset, littleEndian);
                        offset += 2;
                        for (let i = 0; i < tags; i++) {
                            if (view.getUint16(offset + (i * 12), littleEndian) === 0x0112) {
                                return resolve(view.getUint16(offset + (i * 12) + 8, littleEndian));
                            }
                        }
                    } else if ((marker & 0xFF00) !== 0xFF00) {
                        break;
                    } else {
                        offset += view.getUint16(offset, false);
                    }
                }
                return resolve(-1);
            };
            reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
        });
    }

    generateReportBtn.addEventListener('click', async () => {
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                alert('Error: La librería jsPDF no está cargada correctamente.');
                return;
            }
            const doc = new jsPDF();
            let y = 15;

            doc.rect(5, 5, 200, 287);

            doc.setFontSize(22);
            doc.text('Informe de Equipos Industriales', 105, y, { align: 'center' });
            y += 8;
            doc.line(10, y, 200, y);
            y += 8;

            doc.setFontSize(16);
            doc.text(`Operador: ${document.getElementById('operator').value || 'N/A'}`, 10, y);
            y += 8;
            doc.line(10, y, 200, y);
            y += 8;

            doc.text(`Legajo: ${document.getElementById('legajo').value || 'N/A'}`, 10, y);
            y += 8;
            doc.line(10, y, 200, y);
            y += 8;

            doc.text(`Fecha y Hora: ${datetimeString}`, 10, y);
            y += 8;
            doc.line(10, y, 200, y);
            y += 8;

            doc.text(`Tipo de Equipo: ${equipmentType.value || 'N/A'}`, 10, y);
            y += 8;
            doc.line(10, y, 200, y);
            y += 8;

            if (equipmentType.value !== 'Tanques') {
                doc.text(`Número de TAG: ${document.getElementById('tag').value || 'N/A'}`, 10, y);
                y += 8;
                doc.line(10, y, 200, y);
                y += 8;

                doc.text(`Ubicación: ${document.getElementById('location').value || 'N/A'}`, 10, y);
                y += 8;
                doc.line(10, y, 200, y);
                y += 8;

                const observations = document.getElementById('observations').value || 'N/A';
                const splitText = doc.splitTextToSize(`Observaciones: ${observations}`, 180);
                splitText.forEach(line => {
                    doc.text(line, 10, y);
                    y += 8;
                });
                doc.line(10, y, 200, y);
                y += 8;
            } else {
                const tanks = [
                    { id: 'tank1', name: 'Tanque 1 (Propano Fuera de Especificación)' },
                    { id: 'tank2', name: 'Tanque 2 (Butano Fuera de Especificación)' },
                    { id: 'tank3', name: 'Tanque 3 (Butano)' },
                    { id: 'tank4', name: 'Tanque 4 (Butano)' },
                    { id: 'tank5', name: 'Tanque 5 (Propano)' },
                    { id: 'tank6', name: 'Tanque 6 (Propano)' },
                    { id: 'tank7', name: 'Tanque 7 (Gasolina)', onlyLevel: true }
                ];
                for (const tank of tanks) {
                    doc.text(`${tank.name}:`, 10, y);
                    y += 8;
                    doc.line(10, y, 200, y);
                    y += 8;

                    const level = document.getElementById(`${tank.id}-level`).value;
                    doc.text(`  Nivel/Altura (cm): ${level || 'N/A'}`, 10, y);
                    y += 8;
                    doc.line(10, y, 200, y);
                    y += 8;

                    if (!tank.onlyLevel) {
                        const pressure = document.getElementById(`${tank.id}-pressure`).value;
                        doc.text(`  Presión (kg/cm²): ${pressure || 'N/A'}`, 10, y);
                        y += 8;
                        doc.line(10, y, 200, y);
                        y += 8;

                        const temp = document.getElementById(`${tank.id}-temp`).value;
                        doc.text(`  Temperatura (°C): ${temp || 'N/A'}`, 10, y);
                        y += 8;
                        doc.line(10, y, 200, y);
                        y += 8;
                    }
                }
            }

            doc.text(`Estado: ${document.getElementById('status').value || 'N/A'}`, 10, y);
            y += 8;
            doc.line(10, y, 200, y);
            y += 12;

            doc.text('Fotografías:', 10, y);
            y += 8;
            doc.line(10, y, 200, y);
            y += 12;
            const files = photosInput.files;
            let x = 10;
            for (let i = 0; i < files.length; i++) {
                try {
                    const file = files[i];
                    const imgData = await getOrientedImageData(file);
                    if (x + 60 > 200) {
                        y += 60;
                        x = 10;
                        if (y > 250) {
                            doc.addPage();
                            doc.rect(5, 5, 200, 287);
                            y = 10;
                            x = 10;
                        }
                    }
                    doc.addImage(imgData, 'JPEG', x, y, 50, 50);
                    x += 60;
                } catch (error) {
                    console.error('Error al procesar imagen:', error);
                    doc.text(`Error al cargar imagen ${i + 1}`, x, y);
                    x += 60;
                }
            }
            y += 60;
            doc.line(10, y, 200, y);

            doc.save('informe_equipos.pdf');
        } catch (error) {
            console.error('Error al generar el PDF:', error);
            alert('Error al generar el informe. Por favor, verifica los datos e intenta de nuevo.');
        }
    });
});
