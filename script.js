const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('close-sidebar');
const soundButtons = document.querySelectorAll('.sound-btn');
const toast = document.getElementById('toast-notification');

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

menuToggle.addEventListener('click', () => sidebar.classList.add('active'));
closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));

soundButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        showToast(btn.classList.contains('active') ? "Audio stream engaged" : "Audio stream severed");
    });
});

