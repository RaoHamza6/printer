// ===== Tool Navigation =====
const toolNavButtons = document.querySelectorAll('.tool-nav-btn');
const toolSections = document.querySelectorAll('.tool-section');

toolNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;

        // Update active button
        toolNavButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active section
        toolSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `tool-${tool}`) {
                section.classList.add('active');
            }
        });
    });
});

// ===== SHARED UTILITIES =====
const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== TOOL 1: ID CARD PRINTER =====
let frontImage = null;
let backImage = null;

const frontImageInput = document.getElementById('frontImageInput');
const backImageInput = document.getElementById('backImageInput');
const frontUploadArea = document.getElementById('frontUploadArea');
const backUploadArea = document.getElementById('backUploadArea');
const frontPreview = document.getElementById('frontPreview');
const backPreview = document.getElementById('backPreview');
const frontPreviewImg = document.getElementById('frontPreviewImg');
const backPreviewImg = document.getElementById('backPreviewImg');
const removeFrontBtn = document.getElementById('removeFrontBtn');
const removeBackBtn = document.getElementById('removeBackBtn');
const printBtn = document.getElementById('printBtn');
const resetBtn = document.getElementById('resetBtn');
const frontGrid = document.getElementById('frontGrid');
const backGrid = document.getElementById('backGrid');

if (frontImageInput) {
    frontImageInput.addEventListener('change', (e) => handleImageUpload(e, 'front'));
    backImageInput.addEventListener('change', (e) => handleImageUpload(e, 'back'));

    [frontUploadArea, backUploadArea].forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('drag-over');
        });
        area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');
            const side = area.id === 'frontUploadArea' ? 'front' : 'back';
            const input = side === 'front' ? frontImageInput : backImageInput;
            if (e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
                handleImageUpload({ target: input }, side);
            }
        });
    });

    removeFrontBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        frontImage = null;
        frontImageInput.value = '';
        frontPreview.style.display = 'none';
        frontUploadArea.querySelector('.upload-label').style.display = 'flex';
        updatePrintButton();
    });

    removeBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        backImage = null;
        backImageInput.value = '';
        backPreview.style.display = 'none';
        backUploadArea.querySelector('.upload-label').style.display = 'flex';
        updatePrintButton();
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all images?')) {
            frontImage = null;
            backImage = null;
            frontImageInput.value = '';
            backImageInput.value = '';
            frontPreview.style.display = 'none';
            backPreview.style.display = 'none';
            frontUploadArea.querySelector('.upload-label').style.display = 'flex';
            backUploadArea.querySelector('.upload-label').style.display = 'flex';
            frontGrid.innerHTML = '';
            backGrid.innerHTML = '';
            updatePrintButton();
        }
    });

    printBtn.addEventListener('click', () => {
        generatePrintLayout();
        setTimeout(() => window.print(), 500);
    });
}

function handleImageUpload(event, side) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        if (side === 'front') {
            frontImage = imageData;
            frontPreviewImg.src = imageData;
            frontPreview.style.display = 'block';
            frontUploadArea.querySelector('.upload-label').style.display = 'none';
        } else {
            backImage = imageData;
            backPreviewImg.src = imageData;
            backPreview.style.display = 'block';
            backUploadArea.querySelector('.upload-label').style.display = 'none';
        }
        updatePrintButton();
    };
    reader.readAsDataURL(file);
}

function updatePrintButton() {
    printBtn.disabled = !(frontImage && backImage);
}

function generatePrintLayout() {
    frontGrid.innerHTML = '';
    backGrid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        const img = document.createElement('img');
        img.src = frontImage;
        cardItem.appendChild(img);
        frontGrid.appendChild(cardItem);
    }
    for (let i = 0; i < 8; i++) {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        const img = document.createElement('img');
        img.src = backImage;
        cardItem.appendChild(img);
        backGrid.appendChild(cardItem);
    }
}

// ===== TOOL 2: IMAGES TO PDF =====
let uploadedImages = [];
const imagesInput = document.getElementById('imagesInput');
const imagesUploadArea = document.getElementById('imagesUploadArea');
const imagesPreviewGrid = document.getElementById('imagesPreviewGrid');
const clearImagesBtn = document.getElementById('clearImagesBtn');
const generateImagesPdfBtn = document.getElementById('generateImagesPdfBtn');

if (imagesInput) {
    imagesInput.addEventListener('change', (e) => handleMultipleImages(e.target.files));

    imagesUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imagesUploadArea.classList.add('drag-over');
    });
    imagesUploadArea.addEventListener('dragleave', () => imagesUploadArea.classList.remove('drag-over'));
    imagesUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imagesUploadArea.classList.remove('drag-over');
        handleMultipleImages(e.dataTransfer.files);
    });

    clearImagesBtn.addEventListener('click', () => {
        uploadedImages = [];
        imagesInput.value = '';
        updateImagesPreview();
        updateImagesPdfButton();
    });

    generateImagesPdfBtn.addEventListener('click', async () => {
        if (uploadedImages.length === 0) return;
        try {
            const pdfDoc = await PDFDocument.create();
            for (const imgData of uploadedImages) {
                let image;
                if (imgData.startsWith('data:image/png')) {
                    image = await pdfDoc.embedPng(imgData);
                } else {
                    image = await pdfDoc.embedJpg(imgData);
                }
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }
            const pdfBytes = await pdfDoc.save();
            downloadPdf(pdfBytes, 'images-converted.pdf');
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Error generating PDF: ' + error.message);
        }
    });
}

function handleMultipleImages(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImages.push(e.target.result);
            updateImagesPreview();
            updateImagesPdfButton();
        };
        reader.readAsDataURL(file);
    });
}

function updateImagesPreview() {
    imagesPreviewGrid.innerHTML = '';
    uploadedImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `
            <img src="${img}" alt="Image ${index + 1}">
            <button class="remove-btn" onclick="removeImage(${index})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        `;
        imagesPreviewGrid.appendChild(item);
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImagesPreview();
    updateImagesPdfButton();
}

function updateImagesPdfButton() {
    generateImagesPdfBtn.disabled = uploadedImages.length === 0;
}

// ===== TOOL 3: PDF MERGER =====
let mergerFiles = [];
const pdfMergerInput = document.getElementById('pdfMergerInput');
const pdfMergerUploadArea = document.getElementById('pdfMergerUploadArea');
const pdfMergerList = document.getElementById('pdfMergerList');
const clearMergerBtn = document.getElementById('clearMergerBtn');
const mergePdfsBtn = document.getElementById('mergePdfsBtn');

if (pdfMergerInput) {
    pdfMergerInput.addEventListener('change', (e) => handleMergerFiles(e.target.files));
    setupDragDrop(pdfMergerUploadArea, pdfMergerInput, handleMergerFiles);

    clearMergerBtn.addEventListener('click', () => {
        mergerFiles = [];
        updateMergerList();
    });

    mergePdfsBtn.addEventListener('click', async () => {
        if (mergerFiles.length < 2) return;
        try {
            const mergedPdf = await PDFDocument.create();
            for (const file of mergerFiles) {
                const arrayBuffer = await readFileAsArrayBuffer(file);
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const pdfBytes = await mergedPdf.save();
            downloadPdf(pdfBytes, 'merged-document.pdf');
        } catch (error) {
            alert('Error merging PDFs: ' + error.message);
        }
    });
}

function handleMergerFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            mergerFiles.push(file);
        }
    });
    updateMergerList();
}

function updateMergerList() {
    pdfMergerList.innerHTML = '';
    mergerFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'pdf-item';
        item.draggable = true;
        item.innerHTML = `
            <div class="pdf-item-info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                    <div class="pdf-item-name">${file.name}</div>
                    <div class="pdf-item-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="pdf-item-remove" onclick="removeMergerFile(${index})">×</button>
        `;
        // Add drag events for reordering
        item.addEventListener('dragstart', () => item.classList.add('dragging'));
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            // Reorder logic would go here
        });
        pdfMergerList.appendChild(item);
    });
    mergePdfsBtn.disabled = mergerFiles.length < 2;
}

function removeMergerFile(index) {
    mergerFiles.splice(index, 1);
    updateMergerList();
}

// ===== TOOL 4: PDF SPLITTER =====
let splitterFile = null;
let splitterPdfDoc = null;
const pdfSplitterInput = document.getElementById('pdfSplitterInput');
const pdfSplitterUploadArea = document.getElementById('pdfSplitterUploadArea');
const pdfSplitterPreview = document.getElementById('pdfSplitterPreview');
const splitterOptions = document.getElementById('splitterOptions');
const extractPagesBtn = document.getElementById('extractPagesBtn');
const splitAllBtn = document.getElementById('splitAllBtn');
const clearSplitterBtn = document.getElementById('clearSplitterBtn');

if (pdfSplitterInput) {
    pdfSplitterInput.addEventListener('change', (e) => handleSplitterFile(e.target.files[0]));
    setupDragDrop(pdfSplitterUploadArea, pdfSplitterInput, (files) => handleSplitterFile(files[0]));

    clearSplitterBtn.addEventListener('click', () => {
        splitterFile = null;
        splitterPdfDoc = null;
        pdfSplitterPreview.innerHTML = '';
        splitterOptions.style.display = 'none';
        extractPagesBtn.disabled = true;
        splitAllBtn.disabled = true;
        pdfSplitterInput.value = '';
    });

    extractPagesBtn.addEventListener('click', async () => {
        const range = document.getElementById('pageRangeInput').value;
        if (!range) return alert('Please enter page range');

        try {
            const pages = parsePageRange(range, splitterPdfDoc.getPageCount());
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(splitterPdfDoc, pages.map(p => p - 1));
            copiedPages.forEach(page => newPdf.addPage(page));
            const pdfBytes = await newPdf.save();
            downloadPdf(pdfBytes, 'extracted-pages.pdf');
        } catch (error) {
            alert('Error extracting pages: ' + error.message);
        }
    });

    splitAllBtn.addEventListener('click', async () => {
        try {
            const zip = new JSZip();
            const pageCount = splitterPdfDoc.getPageCount();

            for (let i = 0; i < pageCount; i++) {
                const newPdf = await PDFDocument.create();
                const [page] = await newPdf.copyPages(splitterPdfDoc, [i]);
                newPdf.addPage(page);
                const pdfBytes = await newPdf.save();
                zip.file(`page-${i + 1}.pdf`, pdfBytes);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            downloadBlob(content, 'split-pages.zip');
        } catch (error) {
            alert('Error splitting PDF: ' + error.message);
        }
    });
}

async function handleSplitterFile(file) {
    if (!file || file.type !== 'application/pdf') return;
    splitterFile = file;
    const arrayBuffer = await readFileAsArrayBuffer(file);
    splitterPdfDoc = await PDFDocument.load(arrayBuffer);

    splitterOptions.style.display = 'block';
    extractPagesBtn.disabled = false;
    splitAllBtn.disabled = false;

    renderPdfThumbnails(file, pdfSplitterPreview);
}

// ===== TOOL 5: PDF TO IMAGES =====
let pdfToImagesFile = null;
const pdfToImagesInput = document.getElementById('pdfToImagesInput');
const pdfToImagesUploadArea = document.getElementById('pdfToImagesUploadArea');
const pdfToImagesPreview = document.getElementById('pdfToImagesPreview');
const pdfToImagesOptions = document.getElementById('pdfToImagesOptions');
const convertToImagesBtn = document.getElementById('convertToImagesBtn');
const clearPdfToImagesBtn = document.getElementById('clearPdfToImagesBtn');

if (pdfToImagesInput) {
    pdfToImagesInput.addEventListener('change', (e) => handlePdfToImagesFile(e.target.files[0]));
    setupDragDrop(pdfToImagesUploadArea, pdfToImagesInput, (files) => handlePdfToImagesFile(files[0]));

    clearPdfToImagesBtn.addEventListener('click', () => {
        pdfToImagesFile = null;
        pdfToImagesPreview.innerHTML = '';
        pdfToImagesOptions.style.display = 'none';
        convertToImagesBtn.disabled = true;
        pdfToImagesInput.value = '';
    });

    convertToImagesBtn.addEventListener('click', async () => {
        if (!pdfToImagesFile) return;
        try {
            const zip = new JSZip();
            const format = document.getElementById('imageFormatSelect').value;
            const scale = parseFloat(document.getElementById('imageQualitySlider').value);

            const arrayBuffer = await readFileAsArrayBuffer(pdfToImagesFile);
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const dataUrl = canvas.toDataURL(`image/${format}`);
                const base64 = dataUrl.split(',')[1];
                zip.file(`page-${i}.${format === 'jpeg' ? 'jpg' : 'png'}`, base64, { base64: true });
            }

            const content = await zip.generateAsync({ type: 'blob' });
            downloadBlob(content, 'pdf-images.zip');
        } catch (error) {
            alert('Error converting PDF: ' + error.message);
        }
    });
}

async function handlePdfToImagesFile(file) {
    if (!file || file.type !== 'application/pdf') return;
    pdfToImagesFile = file;
    pdfToImagesOptions.style.display = 'block';
    convertToImagesBtn.disabled = false;
    renderPdfThumbnails(file, pdfToImagesPreview);
}

// ===== TOOL 6: PDF COMPRESSOR =====
let compressorFile = null;
const pdfCompressorInput = document.getElementById('pdfCompressorInput');
const pdfCompressorUploadArea = document.getElementById('pdfCompressorUploadArea');
const compressorOptions = document.getElementById('compressorOptions');
const compressPdfBtn = document.getElementById('compressPdfBtn');
const clearCompressorBtn = document.getElementById('clearCompressorBtn');

if (pdfCompressorInput) {
    pdfCompressorInput.addEventListener('change', (e) => handleCompressorFile(e.target.files[0]));
    setupDragDrop(pdfCompressorUploadArea, pdfCompressorInput, (files) => handleCompressorFile(files[0]));

    clearCompressorBtn.addEventListener('click', () => {
        compressorFile = null;
        compressorOptions.style.display = 'none';
        compressPdfBtn.disabled = true;
        pdfCompressorInput.value = '';
        document.getElementById('fileSizeInfo').innerHTML = '';
    });

    compressPdfBtn.addEventListener('click', async () => {
        if (!compressorFile) return;
        // Note: Client-side compression is limited. We'll basically rewrite the PDF which often optimizes it.
        try {
            const arrayBuffer = await readFileAsArrayBuffer(compressorFile);
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            // Basic optimization by saving
            const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
            downloadPdf(pdfBytes, 'compressed.pdf');
        } catch (error) {
            alert('Error compressing PDF: ' + error.message);
        }
    });
}

function handleCompressorFile(file) {
    if (!file || file.type !== 'application/pdf') return;
    compressorFile = file;
    compressorOptions.style.display = 'block';
    compressPdfBtn.disabled = false;
    document.getElementById('fileSizeInfo').innerHTML = `Original Size: <strong>${formatFileSize(file.size)}</strong>`;
}

// ===== TOOL 7: PDF ROTATOR =====
let rotatorFile = null;
let rotatorPdfDoc = null;
let pageRotations = {}; // Map page index to rotation degrees
const pdfRotatorInput = document.getElementById('pdfRotatorInput');
const pdfRotatorUploadArea = document.getElementById('pdfRotatorUploadArea');
const pdfRotatorPreview = document.getElementById('pdfRotatorPreview');
const rotatorControls = document.getElementById('rotatorControls');
const saveRotatedPdfBtn = document.getElementById('saveRotatedPdfBtn');
const clearRotatorBtn = document.getElementById('clearRotatorBtn');

if (pdfRotatorInput) {
    pdfRotatorInput.addEventListener('change', (e) => handleRotatorFile(e.target.files[0]));
    setupDragDrop(pdfRotatorUploadArea, pdfRotatorInput, (files) => handleRotatorFile(files[0]));

    clearRotatorBtn.addEventListener('click', () => {
        rotatorFile = null;
        rotatorPdfDoc = null;
        pageRotations = {};
        pdfRotatorPreview.innerHTML = '';
        rotatorControls.style.display = 'none';
        saveRotatedPdfBtn.disabled = true;
        pdfRotatorInput.value = '';
    });

    document.getElementById('rotateAllLeft').addEventListener('click', () => rotateAll(-90));
    document.getElementById('rotateAllRight').addEventListener('click', () => rotateAll(90));

    saveRotatedPdfBtn.addEventListener('click', async () => {
        try {
            const pages = rotatorPdfDoc.getPages();
            pages.forEach((page, index) => {
                const rotation = pageRotations[index] || 0;
                page.setRotation(degrees(page.getRotation().angle + rotation));
            });
            const pdfBytes = await rotatorPdfDoc.save();
            downloadPdf(pdfBytes, 'rotated.pdf');
        } catch (error) {
            alert('Error saving rotated PDF: ' + error.message);
        }
    });
}

async function handleRotatorFile(file) {
    if (!file || file.type !== 'application/pdf') return;
    rotatorFile = file;
    const arrayBuffer = await readFileAsArrayBuffer(file);
    rotatorPdfDoc = await PDFDocument.load(arrayBuffer);

    rotatorControls.style.display = 'block';
    saveRotatedPdfBtn.disabled = false;

    renderRotatorThumbnails(file);
}

function rotateAll(angle) {
    const pageCount = rotatorPdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
        pageRotations[i] = (pageRotations[i] || 0) + angle;
        updateThumbnailRotation(i);
    }
}

function updateThumbnailRotation(pageIndex) {
    const thumbnail = document.getElementById(`rotator-thumb-${pageIndex}`);
    if (thumbnail) {
        const rotation = pageRotations[pageIndex] || 0;
        thumbnail.style.transform = `rotate(${rotation}deg)`;
    }
}

async function renderRotatorThumbnails(file) {
    pdfRotatorPreview.innerHTML = '';
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const container = document.createElement('div');
        container.className = 'page-thumbnail';
        container.innerHTML = `
            <div style="overflow: hidden;">
                <canvas id="rotator-thumb-${i - 1}" style="transition: transform 0.3s;"></canvas>
            </div>
            <div class="page-thumbnail-label">Page ${i}</div>
            <div class="page-thumbnail-controls">
                <button class="rotate-btn" onclick="rotatePage(${i - 1}, -90)">↺</button>
                <button class="rotate-btn" onclick="rotatePage(${i - 1}, 90)">↻</button>
            </div>
        `;
        container.querySelector('canvas').replaceWith(canvas);
        canvas.id = `rotator-thumb-${i - 1}`;
        canvas.style.transition = 'transform 0.3s';
        pdfRotatorPreview.appendChild(container);
    }
}

window.rotatePage = (pageIndex, angle) => {
    pageRotations[pageIndex] = (pageRotations[pageIndex] || 0) + angle;
    updateThumbnailRotation(pageIndex);
};

// ===== TOOL 8: PDF WATERMARK =====
let watermarkFile = null;
const pdfWatermarkInput = document.getElementById('pdfWatermarkInput');
const pdfWatermarkUploadArea = document.getElementById('pdfWatermarkUploadArea');
const watermarkOptions = document.getElementById('watermarkOptions');
const applyWatermarkBtn = document.getElementById('applyWatermarkBtn');
const clearWatermarkBtn = document.getElementById('clearWatermarkBtn');

if (pdfWatermarkInput) {
    pdfWatermarkInput.addEventListener('change', (e) => handleWatermarkFile(e.target.files[0]));
    setupDragDrop(pdfWatermarkUploadArea, pdfWatermarkInput, (files) => handleWatermarkFile(files[0]));

    clearWatermarkBtn.addEventListener('click', () => {
        watermarkFile = null;
        watermarkOptions.style.display = 'none';
        applyWatermarkBtn.disabled = true;
        pdfWatermarkInput.value = '';
    });

    document.getElementById('watermarkTypeSelect').addEventListener('change', (e) => {
        const type = e.target.value;
        document.getElementById('textWatermarkOptions').style.display = type === 'text' ? 'block' : 'none';
        document.getElementById('imageWatermarkOptions').style.display = type === 'image' ? 'block' : 'none';
    });

    applyWatermarkBtn.addEventListener('click', async () => {
        if (!watermarkFile) return;
        try {
            const arrayBuffer = await readFileAsArrayBuffer(watermarkFile);
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const type = document.getElementById('watermarkTypeSelect').value;
            const position = document.getElementById('watermarkPosition').value;
            const opacity = parseFloat(document.getElementById('watermarkOpacity').value);

            for (const page of pages) {
                const { width, height } = page.getSize();
                let x, y;

                if (type === 'text') {
                    const text = document.getElementById('watermarkText').value || 'Watermark';
                    const fontSize = parseInt(document.getElementById('watermarkFontSize').value);
                    const colorHex = document.getElementById('watermarkColor').value;
                    const r = parseInt(colorHex.substr(1, 2), 16) / 255;
                    const g = parseInt(colorHex.substr(3, 2), 16) / 255;
                    const b = parseInt(colorHex.substr(5, 2), 16) / 255;

                    // Calculate position
                    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                    const textWidth = font.widthOfTextAtSize(text, fontSize);

                    if (position === 'center') { x = (width - textWidth) / 2; y = height / 2; }
                    else if (position === 'top-left') { x = 20; y = height - fontSize - 20; }
                    else if (position === 'top-right') { x = width - textWidth - 20; y = height - fontSize - 20; }
                    else if (position === 'bottom-left') { x = 20; y = 20; }
                    else if (position === 'bottom-right') { x = width - textWidth - 20; y = 20; }

                    page.drawText(text, {
                        x, y,
                        size: fontSize,
                        color: rgb(r, g, b),
                        opacity: opacity,
                    });
                } else {
                    const imgFile = document.getElementById('watermarkImageInput').files[0];
                    if (imgFile) {
                        const imgBuffer = await readFileAsArrayBuffer(imgFile);
                        let image;
                        if (imgFile.type === 'image/png') image = await pdfDoc.embedPng(imgBuffer);
                        else image = await pdfDoc.embedJpg(imgBuffer);

                        const imgDims = image.scale(0.5); // Scale down a bit

                        if (position === 'center') { x = (width - imgDims.width) / 2; y = (height - imgDims.height) / 2; }
                        else if (position === 'top-left') { x = 20; y = height - imgDims.height - 20; }
                        else if (position === 'top-right') { x = width - imgDims.width - 20; y = height - imgDims.height - 20; }
                        else if (position === 'bottom-left') { x = 20; y = 20; }
                        else if (position === 'bottom-right') { x = width - imgDims.width - 20; y = 20; }

                        page.drawImage(image, {
                            x, y,
                            width: imgDims.width,
                            height: imgDims.height,
                            opacity: opacity,
                        });
                    }
                }
            }
            const pdfBytes = await pdfDoc.save();
            downloadPdf(pdfBytes, 'watermarked.pdf');
        } catch (error) {
            alert('Error adding watermark: ' + error.message);
        }
    });
}

function handleWatermarkFile(file) {
    if (!file || file.type !== 'application/pdf') return;
    watermarkFile = file;
    watermarkOptions.style.display = 'block';
    applyWatermarkBtn.disabled = false;
}

// ===== COMMON HELPERS =====
function setupDragDrop(area, input, handler) {
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
    });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            input.files = e.dataTransfer.files;
            handler(e.dataTransfer.files);
        }
    });
}

function downloadPdf(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function parsePageRange(range, maxPages) {
    const pages = new Set();
    const parts = range.split(',');

    parts.forEach(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (start && end) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= maxPages) pages.add(i);
                }
            }
        } else {
            const page = Number(part);
            if (page >= 1 && page <= maxPages) pages.add(page);
        }
    });

    return Array.from(pages).sort((a, b) => a - b);
}

async function renderPdfThumbnails(file, container) {
    container.innerHTML = '<div class="loading-spinner"></div> Loading preview...';
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        container.innerHTML = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const thumb = document.createElement('div');
            thumb.className = 'page-thumbnail';
            thumb.innerHTML = `<div class="page-thumbnail-label">Page ${i}</div>`;
            thumb.prepend(canvas);
            container.appendChild(thumb);
        }
    } catch (error) {
        container.innerHTML = 'Error loading preview';
        console.error(error);
    }
}

// Initialize PDF.js worker
if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Animation on Load
window.addEventListener('load', () => {
    document.querySelectorAll('.upload-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});
