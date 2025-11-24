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

frontImageInput.addEventListener('change', (e) => handleImageUpload(e, 'front'));
backImageInput.addEventListener('change', (e) => handleImageUpload(e, 'back'));

function handleImageUpload(event, side) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
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

[frontUploadArea, backUploadArea].forEach(area => {
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', () => {
        area.classList.remove('drag-over');
    });

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

function updatePrintButton() {
    printBtn.disabled = !(frontImage && backImage);
}

printBtn.addEventListener('click', () => {
    generatePrintLayout();
    setTimeout(() => window.print(), 500);
});

function generatePrintLayout() {
    frontGrid.innerHTML = '';
    backGrid.innerHTML = '';

    for (let i = 0; i < 8; i++) {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        const img = document.createElement('img');
        img.src = frontImage;
        img.alt = `Front ID Card ${i + 1}`;
        cardItem.appendChild(img);
        frontGrid.appendChild(cardItem);
    }

    for (let i = 0; i < 8; i++) {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        const img = document.createElement('img');
        img.src = backImage;
        img.alt = `Back ID Card ${i + 1}`;
        cardItem.appendChild(img);
        backGrid.appendChild(cardItem);
    }
}

updatePrintButton();

// ===== TOOL 2: IMAGES TO PDF =====
let uploadedImages = [];

const imagesInput = document.getElementById('imagesInput');
const imagesUploadArea = document.getElementById('imagesUploadArea');
const imagesPreviewGrid = document.getElementById('imagesPreviewGrid');
const clearImagesBtn = document.getElementById('clearImagesBtn');
const generateImagesPdfBtn = document.getElementById('generateImagesPdfBtn');

imagesInput.addEventListener('change', (e) => handleMultipleImages(e.target.files));

imagesUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imagesUploadArea.classList.add('drag-over');
});

imagesUploadArea.addEventListener('dragleave', () => {
    imagesUploadArea.classList.remove('drag-over');
});

imagesUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imagesUploadArea.classList.remove('drag-over');
    handleMultipleImages(e.dataTransfer.files);
});

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

clearImagesBtn.addEventListener('click', () => {
    uploadedImages = [];
    imagesInput.value = '';
    updateImagesPreview();
    updateImagesPdfButton();
});

generateImagesPdfBtn.addEventListener('click', async () => {
    if (uploadedImages.length === 0) return;

    try {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library is loading. Please wait a moment and try again.');
            return;
        }

        const pdf = new window.jspdf.jsPDF();

        for (let i = 0; i < uploadedImages.length; i++) {
            if (i > 0) pdf.addPage();

            const img = new Image();
            img.src = uploadedImages[i];
            await img.decode();

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgAspect = img.width / img.height;
            const pageAspect = pageWidth / pageHeight;

            let imgWidth, imgHeight;
            if (imgAspect > pageAspect) {
                imgWidth = pageWidth - 20;
                imgHeight = imgWidth / imgAspect;
            } else {
                imgHeight = pageHeight - 20;
                imgWidth = imgHeight * imgAspect;
            }

            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(uploadedImages[i], 'JPEG', x, y, imgWidth, imgHeight);
        }

        pdf.save('images-to-pdf.pdf');
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF: ' + error.message);
    }
});

// ===== Animation on Load =====
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
