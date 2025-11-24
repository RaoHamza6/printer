// ===== State Management =====
let frontImage = null;
let backImage = null;

// ===== DOM Elements =====
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

// ===== File Upload Handling =====
frontImageInput.addEventListener('change', (e) => handleImageUpload(e, 'front'));
backImageInput.addEventListener('change', (e) => handleImageUpload(e, 'back'));

function handleImageUpload(event, side) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    // Validate file size (10MB)
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

// ===== Drag & Drop Support =====
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

// ===== Remove Image Handlers =====
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

// ===== Reset Function =====
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

// ===== Update Print Button State =====
function updatePrintButton() {
    if (frontImage && backImage) {
        printBtn.disabled = false;
    } else {
        printBtn.disabled = true;
    }
}

// ===== Generate Print Layout =====
printBtn.addEventListener('click', () => {
    generatePrintLayout();
    
    // Small delay to ensure layout is rendered
    setTimeout(() => {
        window.print();
    }, 500);
});

function generatePrintLayout() {
    // Clear existing grids
    frontGrid.innerHTML = '';
    backGrid.innerHTML = '';
    
    // Generate 8 copies of front image
    for (let i = 0; i < 8; i++) {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        
        const img = document.createElement('img');
        img.src = frontImage;
        img.alt = `Front ID Card ${i + 1}`;
        
        cardItem.appendChild(img);
        frontGrid.appendChild(cardItem);
    }
    
    // Generate 8 copies of back image
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

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + P to print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !printBtn.disabled) {
        e.preventDefault();
        generatePrintLayout();
        setTimeout(() => {
            window.print();
        }, 500);
    }
    
    // Escape to clear drag-over state
    if (e.key === 'Escape') {
        frontUploadArea.classList.remove('drag-over');
        backUploadArea.classList.remove('drag-over');
    }
});

// ===== Initial State =====
updatePrintButton();

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
