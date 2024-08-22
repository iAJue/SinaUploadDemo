const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const uploadBtn = document.getElementById('uploadBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const imageLink = document.getElementById('imageLink');
const loadingIndicator = document.getElementById('loadingIndicator');
const copySuccess = document.getElementById('copySuccess');
const sidebar = document.getElementById('sidebar');
const openSidebar = document.getElementById('openSidebar');
const closeSidebar = document.getElementById('closeSidebar');
const linkList = document.getElementById('linkList');

let selectedFile; // 全局变量，用于存储选中的文件

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#e6f0ff';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = '';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '';
    const files = e.dataTransfer.files;
    handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    handleFiles(files);
});

function handleFiles(files) {
    if (files.length > 0) {
        selectedFile = files[0]; // 保存选中的文件
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewArea.style.display = 'block';
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
            };
            reader.readAsDataURL(selectedFile);
        } else {
            showError('请选择有效的图片文件！');
        }
    }
}

uploadBtn.addEventListener('click', () => {
    if (selectedFile) { // 使用全局变量检查文件
        const formData = new FormData();
        formData.append('file', selectedFile);

        // 显示加载指示器并隐藏上传按钮
        loadingIndicator.style.display = 'block';
        uploadBtn.style.display = 'none';

        // 这里是实际的上传逻辑
        fetch('weibo.php', { // 确保路径正确
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                // 隐藏加载指示器并显示上传按钮
                loadingIndicator.style.display = 'none';
                uploadBtn.style.display = 'initial';

                if (data.code === 200) {
                    showSuccess(`上传成功！链接: ${data.path}`);
                    loadLinks(); // 加载链接记录
                } else {
                    showError(data.msg);
                }
            })
            .catch(error => {
                // 隐藏加载指示器并显示上传按钮
                loadingIndicator.style.display = 'none';
                uploadBtn.style.display = 'initial';

                showError('上传过程中发生错误，请稍后再试！');
                console.error('Error:', error);
            });
    } else {
        showError('请先选择一张图片！');
    }
});

function showSuccess(message) {
    const link = message.match(/链接: (.+)/)[1]; // 提取链接
    imageLink.textContent = link; // 设置链接文本
    imageLink.onclick = () => copyToClipboard(link); // 添加点击事件
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess();
        }).catch(err => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess();
        } else {
            console.error('Fallback: 复制失败');
        }
    } catch (err) {
        console.error('Fallback: 复制失败', err);
    }
    document.body.removeChild(textArea);
}

function showCopySuccess() {
    copySuccess.style.display = 'block';
    setTimeout(() => {
        copySuccess.style.display = 'none';
    }, 3000); // 3秒后自动隐藏
}

openSidebar.addEventListener('click', () => {
    sidebar.classList.add('open');
    loadLinks(); // 加载链接记录
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

document.addEventListener('click', (event) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && event.target !== openSidebar) {
        sidebar.classList.remove('open');
    }
});

function loadLinks() {
    fetch('upload_log.txt')
        .then(response => {
            if (!response.ok) { // 检查响应是否正常
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            const links = data.split('\n').filter(link => link.trim() !== ''); // 用 '\n' 分割
            const reversedLinks = links.reverse(); // 反转链接数组
            linkList.innerHTML = reversedLinks.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('');
        })
        .catch(error => {
            console.error('Error loading links:', error);
            // 这里可以增加显示错误信息的逻辑，例如：
            linkList.innerHTML = '<li>Error loading links.</li>';
        });
}
