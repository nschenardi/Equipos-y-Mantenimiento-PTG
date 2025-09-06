const { jsPDF } = window.jspdf;

let app = {
    photos: {
        general: [],
        turbo: [],
        propane: [],
        controlRoom: [],
        rci: []
    },
    
    init: function() {
        this.setupEventListeners();
        this.setCurrentDateTime();
    },
    
    setupEventListeners: function() {
        const equipmentTypeSelect = document.getElementById('equipmentType');
        equipmentTypeSelect.addEventListener('change', this.handleEquipmentTypeChange.bind(this));
        
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        generatePdfBtn.addEventListener('click', this.generatePDF.bind(this));
        
        // Configurar inputs de fotos
        this.setupPhotoInputs();

        document.getElementById("tipoEquipo").addEventListener("change", function() {
            const valor = this.value;
            const frickFields = document.getElementById("frickFields");

            // IDs de campos que deben ocultarse
            const camposOcultables = ["numeroTAG", "ubicacion", "estadoEquipo", "prioridad", "btnFoto"];

            if (valor === "frick-k401") {
                frickFields.style.display = "block";
                camposOcultables.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = "none";
                });
            } else {
                frickFields.style.display = "none";
                camposOcultables.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = "block";
                });
            }
        });
    },
    
    setCurrentDateTime: function() {
        const now = new Date();
        // Ajustar para timezone local
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, -1);
        document.getElementById('dateTime').value = localISOTime.substring(0, 16);
    },
    
    handleEquipmentTypeChange: function(event) {
        const selectedType = event.target.value;
        
        // Ocultar todos los campos específicos primero
        document.getElementById('generalFields').style.display = 'none';
        document.getElementById('tankFields').style.display = 'none';
        document.getElementById('oilFields').style.display = 'none';
        document.getElementById('turboExpanderFields').style.display = 'none';
        document.getElementById('propaneCompressorFields').style.display = 'none';
        document.getElementById('rciFields').style.display = 'none';
        document.getElementById('controlRoomFields').style.display = 'none';
        document.getElementById('compressorFields').style.display = 'none';
        document.getElementById('recompressorFields').style.display = 'none';
        document.getElementById('turboExpanderDataFields').style.display = 'none';
        
        // Mostrar campos según el tipo seleccionado
        if (selectedType === 'Tanques') {
            document.getElementById('tankFields').style.display = 'block';
        } else if (selectedType === 'Carga de Aceite Motocompresores y Recompresores') {
            document.getElementById('oilFields').style.display = 'block';
        } else if (selectedType === 'Turbo Expansor') {
            document.getElementById('turboExpanderFields').style.display = 'block';
        } else if (selectedType === 'Compresores de Propano') {
            document.getElementById('propaneCompressorFields').style.display = 'block';
        } else if (selectedType === 'Prueba Semanal de RCI') {
            document.getElementById('rciFields').style.display = 'block';
        } else if (selectedType === 'Sala de Control') {
            document.getElementById('controlRoomFields').style.display = 'block';
        } else if (selectedType === 'Planillas Datos Motocompresores') {
            document.getElementById('compressorFields').style.display = 'block';
        } else if (selectedType === 'Planillas Datos Recompresores') {
            document.getElementById('recompressorFields').style.display = 'block';
        } else if (selectedType === 'Planillas Datos TurboExpander') {
            document.getElementById('turboExpanderDataFields').style.display = 'block';
        } else if (selectedType) {
            document.getElementById('generalFields').style.display = 'block';
        }
    },
    
    setupPhotoInputs: function() {
        const photoInputs = {
            general: document.getElementById('generalPhotoInput'),
            turbo: document.getElementById('turboPhotoInput'),
            propane: document.getElementById('propanePhotoInput'),
            controlRoom: document.getElementById('controlRoomPhotoInput'),
            rci: document.getElementById('rciPhotoInput')
        };
        
        for (const [type, input] of Object.entries(photoInputs)) {
            input.addEventListener('change', (e) => {
                this.handlePhotoUpload(e, type);
            });
        }
    },
    
    takePhoto: function(type) {
        const inputId = `${type}PhotoInput`;
        document.getElementById(inputId).click();
    },
    
    handlePhotoUpload: function(event, type) {
        const files = event.target.files;
        if (!files) return;

        const maxPhotos = type === 'rci' ? 6 : 3;
        if (this.photos[type].length + files.length > maxPhotos) {
            alert(`Solo se permiten un máximo de ${maxPhotos} fotografías para este tipo de equipo.`);
            return;
        }

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = {
                    src: e.target.result,
                    name: file.name
                };
                
                this.photos[type].push(photoData);
                this.updatePhotoPreview(type);
            };
            reader.readAsDataURL(file);
        }
        
        // Reset input para permitir cargar la misma imagen otra vez
        event.target.value = '';
    },
    
    updatePhotoPreview: function(type) {
        const previewContainer = document.getElementById(`${type}PhotoPreview`);
        previewContainer.innerHTML = '';
        
        this.photos[type].forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = 'Foto';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = 'X';
            deleteBtn.onclick = () => {
                this.photos[type].splice(index, 1);
                this.updatePhotoPreview(type);
            };
            
            photoItem.appendChild(img);
            photoItem.appendChild(deleteBtn);
            previewContainer.appendChild(photoItem);
        });
    },
    
    generatePDF: function() {
        const selectedType = document.getElementById('equipmentType').value;
        
        if (!selectedType) {
            alert('Por favor, seleccione un tipo de equipo');
            return;
        }
        
        // Crear instancia de jsPDF
        const pdf = new jsPDF();
        
        // Obtener el número de TAG según el tipo de equipo
        let tagNumber = '';
        if (selectedType === 'Sala de Control') {
            tagNumber = document.getElementById('controlRoomTagNumber').value || 'Sin TAG';
        } else if (selectedType === 'Turbo Expansor') {
            tagNumber = document.getElementById('tagNumberTurbo').value || 'Sin TAG';
        } else if (selectedType === 'Compresores de Propano') {
            tagNumber = document.getElementById('tagNumberPropane').value || 'Sin TAG';
        } else if (selectedType !== 'Tanques' && selectedType !== 'Carga de Aceite Motocompresores y Recompresores' && selectedType !== 'Prueba Semanal de RCI' && selectedType !== 'Planillas Datos Motocompresores' && selectedType !== 'Planillas Datos Recompresores' && selectedType !== 'Planillas Datos TurboExpander') {
            tagNumber = document.getElementById('tagNumber').value || 'Sin TAG';
        } else {
            tagNumber = 'Informe ' + selectedType;
        }
        
        // Configurar nombre del archivo con el número de TAG y fecha automática
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 10);
        const fileName = `${tagNumber.replace(/\s+/g, '_')}_${localISOTime}.pdf`;
        
        // Agregar contenido al PDF
        this.addHeaderToPDF(pdf, selectedType, tagNumber);
        this.addContentToPDF(pdf, selectedType);
        
        // Guardar el PDF
        pdf.save(fileName);

        // Reiniciar la aplicación
        this.resetApp();
    },

    resetApp: function() {
        // Reiniciar el selector de tipo de equipo
        const equipmentTypeSelect = document.getElementById('equipmentType');
        equipmentTypeSelect.value = '';
        this.handleEquipmentTypeChange({ target: equipmentTypeSelect });

        // Limpiar campos comunes
        document.getElementById('operatorName').value = '';
        document.getElementById('legajo').value = '';
        this.setCurrentDateTime(); // Reiniciar fecha y hora automáticamente

        // Limpiar fotos y vistas previas
        Object.keys(this.photos).forEach(type => {
            this.photos[type] = [];
            this.updatePhotoPreview(type);
        });

        // Limpiar campos específicos
        const allInputs = document.querySelectorAll('input, select, textarea');
        allInputs.forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else if (element.tagName === 'SELECT') {
                element.selectedIndex = 0;
            } else if (element.id !== 'dateTime') { // No limpiar dateTime manualmente
                element.value = '';
            }
        });
    },
    
    addHeaderToPDF: function(pdf, equipmentType, tagNumber) {
        pdf.setFillColor(44, 62, 80);
        pdf.rect(0, 0, 210, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.text('Equipos y Mantenimiento PTG', 105, 15, { align: 'center' });
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.text(`Operador: ${document.getElementById('operatorName').value}`, 15, 40);
        pdf.text(`Legajo: ${document.getElementById('legajo').value}`, 15, 47);
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
        pdf.text(`Fecha y Hora: ${localISOTime}`, 15, 54);
        pdf.text(`Tipo de Equipo: ${equipmentType}`, 15, 61);
        
        if (tagNumber && tagNumber !== 'Sin TAG') {
            pdf.text(`Número de TAG: ${tagNumber}`, 15, 68);
        }
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, 75, 195, 75);
    },
    
    addContentToPDF: function(pdf, equipmentType) {
        let yPosition = 85;
        
        if (equipmentType === 'Tanques') {
            this.addTankContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Carga de Aceite Motocompresores y Recompresores') {
            this.addOilContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Turbo Expansor') {
            this.addTurboContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Compresores de Propano') {
            this.addPropaneContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Prueba Semanal de RCI') {
            this.addRCIContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Sala de Control') {
            this.addControlRoomContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Planillas Datos Motocompresores') {
            this.addCompressorContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Planillas Datos Recompresores') {
            this.addRecompressorContentToPDF(pdf, yPosition);
        } else if (equipmentType === 'Planillas Datos TurboExpander') {
            this.addTurboExpanderDataToPDF(pdf, yPosition);
        } else {
            this.addGeneralContentToPDF(pdf, yPosition);
        }
    },
    
    addGeneralContentToPDF: function(pdf, yPosition) {
        const location = document.getElementById('location').value;
        const status = document.getElementById('equipmentStatus').value;
        const observations = document.getElementById('observations').value;
        const priority = document.getElementById('priority').value;
        
        if (location) {
            pdf.text(`Ubicación: ${location}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (priority) {
            pdf.text(`Prioridad: ${priority}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.general.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.general, yPosition + 10);
        }
    },
    
    addControlRoomContentToPDF: function(pdf, yPosition) {
        const status = document.getElementById('controlRoomStatus').value;
        const observations = document.getElementById('controlRoomObservations').value;
        const priority = document.getElementById('priorityControlRoom').value;
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (priority) {
            pdf.text(`Prioridad: ${priority}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.controlRoom.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.controlRoom, yPosition + 10);
        }
    },
    
    addTankContentToPDF: function(pdf, yPosition) {
        const tanks = [
            { id: 'tank1', name: 'Tanque 1 (Propano Fuera de Especificación)' },
            { id: 'tank2', name: 'Tanque 2 (Butano Fuera de Especificación)' },
            { id: 'tank3', name: 'Tanque 3 (Butano)' },
            { id: 'tank4', name: 'Tanque 4 (Butano)' },
            { id: 'tank5', name: 'Tanque 5 (Propano)' },
            { id: 'tank6', name: 'Tanque 6 (Propano)' },
            { id: 'tank7', name: 'Tanque 7 (Gasolina)' }
        ];
        
        for (const tank of tanks) {
            const level = document.getElementById(`${tank.id}Level`).value;
            const pressure = document.getElementById(`${tank.id}Pressure`) ? document.getElementById(`${tank.id}Pressure`).value : 'N/A';
            const temperature = document.getElementById(`${tank.id}Temperature`) ? document.getElementById(`${tank.id}Temperature`).value : 'N/A';
            
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(tank.name, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            pdf.text(`Nivel: ${level || 'N/A'} cm`, 20, yPosition);
            yPosition += 7;
            
            if (tank.id !== 'tank7') {
                pdf.text(`Presión: ${pressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Temperatura: ${temperature || 'N/A'} °C`, 20, yPosition);
                yPosition += 7;
            }
            
            yPosition += 5;
            
            // Verificar si necesitamos una nueva página
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
    },
    
    addOilContentToPDF: function(pdf, yPosition) {
        const equipment = [
            { id: 'mc1', name: 'MC#1' },
            { id: 'mc2', name: 'MC#2' },
            { id: 'mc3', name: 'MC#3' },
            { id: 'mc5', name: 'MC#5' },
            { id: 'mc6', name: 'MC#6' },
            { id: 'rc4', name: 'RC#4' },
            { id: 'rc7', name: 'RC#7' },
            { id: 'rc8', name: 'RC#8' },
            { id: 'rc9', name: 'RC#9' }
        ];
        
        for (const eq of equipment) {
            let motorCm = document.getElementById(`${eq.id}MotorCm`);
            let compressorCm = document.getElementById(`${eq.id}CompressorCm`);
            let rc9OilLevel = document.getElementById('rc9OilLevelCm');

            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(eq.name, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');

            if (eq.id === 'rc9') {
                if (rc9OilLevel && rc9OilLevel.value) {
                    pdf.text(`Nivel de Aceite: ${rc9OilLevel.value} cm`, 20, yPosition);
                    yPosition += 7;
                } else {
                    pdf.text(`Nivel de Aceite: N/A`, 20, yPosition);
                    yPosition += 7;
                }
            } else {
                if (motorCm && motorCm.value) {
                    pdf.text(`Nivel Lado Motor: ${motorCm.value} cm`, 20, yPosition);
                    yPosition += 7;
                } else {
                    pdf.text(`Nivel Lado Motor: N/A`, 20, yPosition);
                    yPosition += 7;
                }

                if (compressorCm && compressorCm.value) {
                    pdf.text(`Nivel Lado Compresor: ${compressorCm.value} cm`, 20, yPosition);
                    yPosition += 7;
                } else {
                    pdf.text(`Nivel Lado Compresor: N/A`, 20, yPosition);
                    yPosition += 7;
                }
            }
            
            yPosition += 5;
            
            // Verificar si necesitamos una nueva página
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
        
        // Agregar nivel de cisterna de aceite
        const cisternLevel = document.getElementById('oilCisternLevel').value;
        pdf.text(`Nivel de Cisterna de Aceite: ${cisternLevel || 'N/A'} cm`, 15, yPosition);
        yPosition += 7;
    },
    
    addTurboContentToPDF: function(pdf, yPosition) {
        const location = document.getElementById('locationTurbo').value;
        const status = document.getElementById('equipmentStatusTurbo').value;
        const oilLoad = document.getElementById('oilLoadTurbo').value;
        const observations = document.getElementById('observationsTurbo').value;
        const priority = document.getElementById('priorityTurbo').value;
        
        if (location) {
            pdf.text(`Ubicación: ${location}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (priority) {
            pdf.text(`Prioridad: ${priority}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (oilLoad) {
            pdf.text(`Carga de Aceite: ${oilLoad} litros`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.turbo.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.turbo, yPosition + 10);
        }
    },
    
    addPropaneContentToPDF: function(pdf, yPosition) {
        const location = document.getElementById('locationPropane').value;
        const status = document.getElementById('equipmentStatusPropane').value;
        const oilLoad = document.getElementById('oilLoadPropane').value;
        const observations = document.getElementById('observationsPropane').value;
        const priority = document.getElementById('priorityPropane').value;
        
        if (location) {
            pdf.text(`Ubicación: ${location}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (status) {
            pdf.text(`Estado: ${status}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (priority) {
            pdf.text(`Prioridad: ${priority}`, 15, yPosition);
            yPosition += 7;
        }
        
        if (oilLoad) {
            pdf.text(`Carga de Aceite: ${oilLoad} litros`, 15, yPosition);
            yPosition += 7;
        }
        
        if (observations) {
            yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 15, yPosition + 10, 180);
        }
        
        // Agregar fotos si existen
        if (this.photos.propane.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.propane, yPosition + 10);
        }
    },
    
    addRCIContentToPDF: function(pdf, yPosition) {
        const equipment = [
            { id: 'p402', name: 'P-402 ELECTROBOMBA 120 m3' },
            { id: 'p401', name: 'P-401 ELECTROBOMBA 500 m3' },
            { id: 'p401b', name: 'P-401 B MOTOBOMBA VOLVO' },
            { id: 'cummins', name: 'MOTOBOMBA CUMMINS' },
            { id: 'hidroFrac', name: 'MOTOBOMBA HIDRO-FRAC' },
            { id: 'additional', name: 'EQUIPAMIENTOS ADICIONALES' },
            { id: 'tk401a', name: 'TK-401A' },
            { id: 'tanqueAustraliano', name: 'Tanque Australiano' }
        ];
        
        for (const eq of equipment) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(eq.name, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            
            if (eq.id === 'p402' || eq.id === 'p401') {
                const suctionPressure = document.getElementById(`${eq.id}SuctionPressure`).value;
                const dischargePressure = document.getElementById(`${eq.id}DischargePressure`).value;
                const observations = document.getElementById(`${eq.id}Observations`).value;
                
                pdf.text(`P succión: ${suctionPressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`P descarga: ${dischargePressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                if (observations) {
                    yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 20, yPosition + 5, 170);
                }
            } else if (eq.id === 'p401b') {
                const suctionPressure = document.getElementById('p401bSuctionPressure').value;
                const dischargePressure = document.getElementById('p401bDischargePressure').value;
                const oilPressure = document.getElementById('p401bOilPressure').value;
                const refrigerantTemp = document.getElementById('p401bRefrigerantTemp').value;
                const rpm = document.getElementById('p401bRPM').value;
                const ambientTemp = document.getElementById('p401bAmbientTemp').value;
                const current1 = document.getElementById('p401bCurrent1').value;
                const voltage1 = document.getElementById('p401bVoltage1').value;
                const current2 = document.getElementById('p401bCurrent2').value;
                const voltage2 = document.getElementById('p401bVoltage2').value;
                const gasOilLevel = document.getElementById('p401bGasOilLevel').value;
                const refrigerantLevel = document.getElementById('p401bRefrigerantLevel').value;
                const oilLevel = document.getElementById('p401bOilLevel').value;
                const observations = document.getElementById('p401bObservations').value;
                
                pdf.text(`P succión: ${suctionPressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`P descarga: ${dischargePressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`P aceite: ${oilPressure || 'N/A'} PSI`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Tº refrigerante: ${refrigerantTemp || 'N/A'} ºC`, 20, yPosition);
                yPosition += 7;
                pdf.text(`RPM: ${rpm || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                pdf.text(`T ambiente: ${ambientTemp || 'N/A'} ºC`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Corriente1: ${current1 || 'N/A'} Amp`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Voltaje1: ${voltage1 || 'N/A'} Volt`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Corriente2: ${current2 || 'N/A'} Amp`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Voltaje2: ${voltage2 || 'N/A'} Volt`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Gas Oil: ${gasOilLevel || 'N/A'} lts`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Refrigerante ok?: ${refrigerantLevel || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Aceite ok?: ${oilLevel || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                if (observations) {
                    yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 20, yPosition + 5, 170);
                }
            } else if (eq.id === 'cummins') {
                const dischargePressure = document.getElementById('cumminsDischargePressure').value;
                const oilPressure = document.getElementById('cumminsOilPressure').value;
                const refrigerantTemp = document.getElementById('cumminsRefrigerantTemp').value;
                const horometer = document.getElementById('cumminsHorometer').value;
                const batteryCurrent = document.getElementById('cumminsBatteryCurrent').value;
                const gasOilLevel = document.getElementById('cumminsGasOilLevel').value;
                const rpm = document.getElementById('cumminsRPM').value;
                const refrigerantLevel = document.getElementById('cumminsRefrigerantLevel').value;
                const oilLevel = document.getElementById('cumminsOilLevel').value;
                const observations = document.getElementById('cumminsObservations').value;
                
                pdf.text(`P descarga: ${dischargePressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`P aceite: ${oilPressure || 'N/A'} kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Tº Refrigerante: ${refrigerantTemp || 'N/A'} ºC`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Horómetro: ${horometer || 'N/A'} hr`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Corriente en Cargador Batería: ${batteryCurrent || 'N/A'} Amp`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Gas Oil: ${gasOilLevel || 'N/A'} lts`, 20, yPosition);
                yPosition += 7;
                pdf.text(`RPM: ${rpm || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Refrigerante ok?: ${refrigerantLevel || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Aceite ok?: ${oilLevel || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                if (observations) {
                    yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 20, yPosition + 5, 170);
                }
            } else if (eq.id === 'hidroFrac') {
                const suctionPressure = document.getElementById('hidroFracSuctionPressure').value;
                const dischargePressure = document.getElementById('hidroFracDischargePressure').value;
                const refrigerantLevel = document.getElementById('hidroFracRefrigerantLevel').value;
                const oilLevel = document.getElementById('hidroFracOilLevel').value;
                const observations = document.getElementById('hidroFracObservations').value;
                
                pdf.text(`P succión: ${suctionPressure || 'N/A'} Kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`P descarga: ${dischargePressure || 'N/A'} Kg/cm²`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Refrigerante ok?: ${refrigerantLevel || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                pdf.text(`Nivel de Aceite ok?: ${oilLevel || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                if (observations) {
                    yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 20, yPosition + 5, 170);
                }
            } else if (eq.id === 'additional') {
                const observations = document.getElementById('additionalObservations').value;
                if (observations) {
                    yPosition = this.addWrappedText(pdf, `Observaciones: ${observations}`, 20, yPosition + 5, 170);
                }
            } else if (eq.id === 'tk401a') {
                const level = document.getElementById('tk401aLevel').value;
                pdf.text(`Nivel: ${level || 'N/A'} m`, 20, yPosition);
                yPosition += 7;
            } else if (eq.id === 'tanqueAustraliano') {
                const level = document.getElementById('tanqueAustralianoLevel').value;
                pdf.text(`Nivel: ${level || 'N/A'} %`, 20, yPosition);
                yPosition += 7;
            }
            
            yPosition += 5;
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
        
        // Agregar fotos si existen
        if (this.photos.rci.length > 0) {
            yPosition = this.addPhotosToPDF(pdf, this.photos.rci, yPosition + 10);
        }
    },
    
    addCompressorContentToPDF: function(pdf, yPosition) {
        const mcNumbers = [1, 2, 3, 5, 6];
        const fields = [
            { id: 'dcsSuctionPressure', label: 'PI5107 Presión de succión DCS' },
            { id: 'lowPressureGasFlow', label: 'Caudeal gas en baja presión' },
            { id: 'suctionPressure', label: 'Presión de Succión' },
            { id: 'dischargePressureCyl1', label: 'Pres Desc Comp Cilindro 1' },
            { id: 'dischargePressureCyl2', label: 'Pres Desc Comp Cilindro 2' },
            { id: 'dischargeTempCylLeft', label: 'Temp Descarga Cilindro Izquierdo' },
            { id: 'dischargeTempCylRight', label: 'Temp Descarga Cilindro Derecho' },
            { id: 'motorIntakeTempLeft', label: 'Temp Admision Motor Banco Izq.' },
            { id: 'motorIntakeTempRight', label: 'Temp Admision Motor Banco Der.' },
            { id: 'motorOilTemp', label: 'Temperatura Aceite Motor' },
            { id: 'compressorOilTemp', label: 'Temperatura Aceite Compresor' },
            { id: 'mainWaterTemp', label: 'Temperatura Agua Principal' },
            { id: 'intakeManifoldPressureLeft', label: 'Presión Multiple Admisión Izquierdo' },
            { id: 'intakeManifoldPressureRight', label: 'Presión Multiple Admisión Derecho' },
            { id: 'airFiltersRight', label: 'Filtros de aire Derecho' },
            { id: 'airFiltersLeft', label: 'Filtros de aire Izquierdo' }
        ];

        for (const mcNumber of mcNumbers) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text(`MC#${mcNumber}`, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            
            let hasData = false;
            for (const field of fields) {
                const value = document.getElementById(`mc${mcNumber}-${field.id}`).value;
                if (value) {
                    pdf.text(`${field.label}: ${value}`, 20, yPosition);
                    yPosition += 7;
                    hasData = true;
                }
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            if (!hasData) {
                pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
                yPosition += 7;
            }
            yPosition += 5;
        }
    },

    addRecompressorContentToPDF: function(pdf, yPosition) {
        const rcNormal = ['4', '7', '8'];
        const rc9 = ['9'];

        const commonFields = [
            { id: 'suctionFlow', label: 'Caudal de Succión' },
            { id: 'ambientTemp', label: 'T. Ambiente' },
            { id: 'motorRPM', label: 'R.P.M. Motor' },
            { id: 'oilFilterDiffPressure', label: 'Pres de Dif Filtros Aceite Motor' },
            { id: 'motorOilPressureBoard', label: 'Pres de Aceite Motor Tablero' },
            { id: 'compressorOilPressureBoard', label: 'Pres de Aceite Compresor Tablero' },
            { id: 'compressorOilPressureIn', label: 'Pres de Aceite Compresor Entrada' },
            { id: 'compressorOilPressureOut', label: 'Pres de Aceite Compresor Salida' },
            { id: 'dischargePressureCyl1', label: 'Pres Desc Comp Cilindro 1' },
            { id: 'dischargePressureCyl2', label: 'Pres Desc Comp Cilindro 2' },
            { id: 'dischargeTempCylLeft', label: 'Temp Descarga Cilindro Izquierdo' },
            { id: 'dischargeTempCylRight', label: 'Temp Descarga Cilindro Derecho' },
            { id: 'compressorSuctionPressure', label: 'Pres Succión Compresor' },
            { id: 'motorIntakeTempLeft', label: 'Temp Admision Motor Banco Izq.' },
            { id: 'motorIntakeTempRight', label: 'Temp Admision Motor Banco Der.' },
            { id: 'motorOilTemp', label: 'Temperatura Aceite Motor' },
            { id: 'compressorOilTemp', label: 'Temperatura Aceite Compresor' },
            { id: 'mainWaterTemp', label: 'Temperatura Agua Principal' },
            { id: 'intakeManifoldPressureLeft', label: 'Presión Multiple Admisión Izquierdo' },
            { id: 'intakeManifoldPressureRight', label: 'Presión Multiple Admisión Derecho' },
            { id: 'airFiltersRight', label: 'Filtros de aire Derecho' },
            { id: 'airFiltersLeft', label: 'Filtros de aire Izquierdo' }
        ];

        const rc9Fields = [
            { id: 'suctionFlow', label: 'Caudal de Succión' },
            { id: 'ambientTemp', label: 'T. Ambiente' },
            { id: 'oilFilterDiffPressure', label: 'Pres de Dif Filtros Aceite Motor' },
            { id: 'compressorOilPressureIn', label: 'Pres de Aceite Compresor Entrada' },
            { id: 'compressorOilPressureOut', label: 'Pres de Aceite Compresor Salida' },
            { id: 'compressorSuctionPressure1st', label: 'Pres Succión Compresor 1 st' },
            { id: 'compressorDischargePressure1st', label: 'Pres Descarga Compresor 1st' },
            { id: 'compressorOilPressure', label: 'Pres de Aceite Compresor' },
            { id: 'compressorSuctionTemp', label: 'Temp Succión Compresor' },
            { id: 'dischargeTempCylinder1', label: 'Temp Descarga Cilindro 1' },
            { id: 'dischargeTempCylinder2', label: 'Temp Descarga Cilindro 2' },
            { id: 'compressorOilTemp', label: 'Temperatura Aceite Compresor' },
            { id: 'motorRPM', label: 'R.P.M. Motor' },
            { id: 'motorOilPressure', label: 'Pres de Aceite Motor' },
            { id: 'mainWaterTemp', label: 'Temperatura Agua Principal' },
            { id: 'motorOilTemp', label: 'Temperatura Aceite Motor' },
            { id: 'airFiltersRight', label: 'Filtros de aire Derecho' },
            { id: 'airFiltersLeft', label: 'Filtros de aire Izquierdo' }
        ];

        for (const rcNumber of rcNormal) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text(`RC#${rcNumber}`, 15, yPosition);
            yPosition += 7;
            
            pdf.setFont(undefined, 'normal');
            let hasData = false;
            for (const field of commonFields) {
                const value = document.getElementById(`rc${rcNumber}-${field.id}`).value;
                if (value) {
                    pdf.text(`${field.label}: ${value}`, 20, yPosition);
                    yPosition += 7;
                    hasData = true;
                }
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            if (!hasData) {
                pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
                yPosition += 7;
            }
            yPosition += 5;
        }

        // Handle RC#9
        for (const rcNumber of rc9) {
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text(`RC#${rcNumber}`, 15, yPosition);
            yPosition += 7;

            pdf.setFont(undefined, 'normal');
            let hasData = false;
            for (const field of rc9Fields) {
                const value = document.getElementById(`rc${rcNumber}-${field.id}`).value;
                if (value) {
                    pdf.text(`${field.label}: ${value}`, 20, yPosition);
                    yPosition += 7;
                    hasData = true;
                }
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            if (!hasData) {
                pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
                yPosition += 7;
            }
            yPosition += 5;
        }
    },
    
    addTurboExpanderDataToPDF: function(pdf, yPosition) {
        const fields = [
            { id: 'expInP', label: 'Presión Entrada Expansor (Exp. In P) (PIC 301B)' },
            { id: 'expInT', label: 'Temperatura Entrada Expansor (Exp. In T)(TI0314)' },
            { id: 'expOutP', label: 'Presión Salida Expansor (Exp. Out P) (PIC 306)' },
            { id: 'expOutT', label: 'Temperatura Salida Expansor (Exp. Out T)(TI0326)' },
            { id: 'expWheelP', label: 'Presión Rueda Expansor (Exp. Wheel P) PI-4' },
            { id: 'compInP', label: 'Presión Entrada Compresor (Comp. In P) PI-309 (PIC0302)' },
            { id: 'compInT', label: 'Temperatura Entrada Compresor (Comp. In T) TI0301' },
            { id: 'compOutP', label: 'Presión Salida Compresor (Comp. Out P) PI-307' },
            { id: 'compOutT', label: 'Temperatura Salida Compresor (Comp Out T)' },
            { id: 'compWheelP', label: 'Presión Rueda Compresor (Comp. Wheel P) PI-8' },
            { id: 'driveBearingThrust', label: 'Presión Empuje Expansor (Drive Bearing Thrust PI-6)' },
            { id: 'loadBearingThrust', label: 'Presión Empuje Compresor (Load Bearing Thurst PI-7)' },
            { id: 'reservoirP', label: 'Presión Reservorio (Reservoir P) PI-2' },
            { id: 'reservoirT', label: 'Temperatura Reservorio (Reservoir T)' },
            { id: 'lubeOilP', label: 'Presión Aceite Lubricante (Lube Oil P) PI-3' },
            { id: 'lubeOilDP', label: 'Diferencia de Presión Aceite Lubricante (Lube Oil DP)' },
            { id: 'sealGasP', label: 'Presión Gas de Sello (Seal Gas P) PI-5' },
            { id: 'sealGasDP', label: 'Diferencia de Presión Gas de Sello (Seal Gas DP)' },
            { id: 'rpm', label: 'RPM' },
            { id: 'expBrgT', label: 'Temperatura Cojinetes Expansor (Exp. Brg. T)' },
            { id: 'compBrgT', label: 'Temperatura Cojinetes Compresor (Comp. Brg. T)' },
            { id: 'expVibX', label: 'Vibración X Expansor (Exp. Vib. X)' },
            { id: 'compVibX', label: 'Vibración X Compresor (Comp. Vib. X)' },
            { id: 'lubeOilInT', label: 'Temperatura Entrada Aceite Lubricante (Lube Oil In T)' },
            { id: 'oilDrainT', label: 'Temperatura Aceite Drenaje (Oil Drain T)' },
            { id: 'sealGasInT', label: 'Temperatura Entrada Gas de Sello (Seal Gas In T)' },
            { id: 'pic0301B', label: '% Aletas Guías (PIC0301B)' },
            { id: 'pic0301A', label: 'JT % (PIC0301A)' },
            { id: 'recycleFIC0301', label: 'Reciclo FIC0301 (Recycle %)' },
            { id: 'fIC0301Opening', label: 'Porcentaje apertura FIC0301' },
            { id: 'flowPercentage', label: 'Valor de caudal (porcentaje)' },
            { id: 'expFlowFIC0101', label: 'Flujo Expansor (FIC0101)' },
            { id: 'compFlow', label: 'Flujo Compresor (FI0102+FIC0201)' },
            { id: 'ambientTempTI0100', label: 'T° Ambiente (TI0100) (°F)' },
            { id: 'sealGasSupplyP', label: 'Presión Suministro Gas de Sello' },
            { id: 'sealGasSupplyT', label: 'T° Suministro Gas de Sello' },
            { id: 'sealGasFlowFI1', label: 'Caudal Gas de Sello FI-1' },
            { id: 'reservoirOilLevel', label: 'NIVEL ACEITE RESERVORIO' },
            { id: 'flowMMSCFD', label: 'CAUDAL (MMSCFD)' }
        ];

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        
        if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
        }
        pdf.text('TurboExpander', 15, yPosition);
        yPosition += 7;
        
        pdf.setFont(undefined, 'normal');
        
        let hasData = false;
        for (const field of fields) {
            const value = document.getElementById(field.id).value;
            if (value) {
                pdf.text(`${field.label}: ${value}`, 20, yPosition);
                yPosition += 7;
                hasData = true;
            }
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
        if (!hasData) {
            pdf.text("No se ingresaron datos para este equipo.", 20, yPosition);
            yPosition += 7;
        }
        yPosition += 5;
    },
    
    addWrappedText: function(pdf, text, x, y, maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * 7);
    },
    
    addPhotosToPDF: function(pdf, photos, yPosition) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Fotografías:', 15, yPosition);
        yPosition += 10;
        
        const imgWidth = 80;
        const imgHeight = 60;
        const spacing = 10;
        
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            
            // Verificar si necesitamos una nueva página
            if (yPosition + imgHeight > 280) {
                pdf.addPage();
                yPosition = 20;
            }
            
            try {
                pdf.addImage(photo.src, 'JPEG', 15, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + spacing;
                
                // Verificar si necesitamos una nueva página después de agregar la imagen
                if (yPosition > 250 && i < photos.length - 1) {
                    pdf.addPage();
                    yPosition = 20;
                }
            } catch (error) {
                console.error('Error al agregar imagen al PDF:', error);
                pdf.text('Error al cargar la imagen', 15, yPosition);
                yPosition += 20;
            }
        }
        
        return yPosition;
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});