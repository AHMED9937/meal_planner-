document.addEventListener('DOMContentLoaded', () => {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    const toast = document.getElementById('save-toast');
    const resetBtn = document.getElementById('reset-btn');
    let saveTimeout;

    // Show save notification toast
    const showToast = () => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    };

    // Load saved data from localStorage
    editables.forEach(el => {
        const id = el.getAttribute('data-id');
        if (id) {
            const savedContent = localStorage.getItem(`m2m_${id}`);
            if (savedContent !== null) {
                el.innerHTML = savedContent;
            }
            
            // Add input listener to save changes
            el.addEventListener('input', () => {
                localStorage.setItem(`m2m_${id}`, el.innerHTML);
                
                // Debounce the toast notification
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    showToast();
                }, 1000);
            });
            
            // Prevent empty tags breaking the layout (e.g. deleting all text)
            el.addEventListener('blur', () => {
                if (el.innerHTML.trim() === '' || el.innerHTML === '<br>') {
                    // Provide a default fallback if emptied
                    const isList = el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol';
                    if (isList) {
                        el.innerHTML = '<li>انقر هنا لإضافة عنصر</li>';
                    } else {
                        el.innerHTML = 'انقر هنا للكتابة';
                    }
                    localStorage.setItem(`m2m_${id}`, el.innerHTML);
                }
            });
            
            // Better UX for lists: hitting enter creates a new list item seamlessly
            if (el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol') {
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        // Let the browser handle creating the next <li> natively
                        // Just ensure we don't accidentally create weird nested divs
                        document.execCommand('insertHTML', false, '<br><br>'); 
                        // Actually, modern browsers handle contenteditable lists very well automatically.
                    }
                });
            }
        }
    });

    // Reset Functionality
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من رغبتك في استعادة الخطة الأصلية؟ سيتم مسح جميع تعديلاتك.')) {
                // Remove all items with prefix m2m_
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('m2m_')) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                // Reload the page to show original HTML content
                window.location.reload();
            }
        });
    }
    
    // Smooth intro animation for cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // Ensure the cards are visible after initial CSS animation
        card.style.opacity = '1';
    });
});
