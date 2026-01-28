document.addEventListener('DOMContentLoaded', (e) => {
  const apps = document.querySelectorAll('.app');

  apps[1].addEventListener('dblclick', () => {
    window.open('http://localhost:3001');
  });

  for (const app of apps) {
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;

    function onMouseMove(e) {
      const distance =
        Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);

      if (distance > 5) {
        hasMoved = true;

        if (!isDragging) {
          isDragging = true;
          app.style.position = 'absolute';
          app.style.zIndex = 0;

          app.style.left = e.clientX - offsetX + 'px';
          app.style.top = e.clientY - offsetY + 'px';
        } else {
          app.style.left = e.clientX - offsetX + 'px';
          app.style.top = e.clientY - offsetY + 'px';
        }
      }
    }

    function onMouseUp(e) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (hasMoved) {
        setTimeout(() => {
          isDragging = false;
        }, 10);
      } else {
        isDragging = false;
      }

      hasMoved = false;
    }

    app.addEventListener('mousedown', (e) => {
      e.preventDefault();

      const rect = app.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      startX = e.clientX;
      startY = e.clientY;
      hasMoved = false;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    app.parentElement.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    app.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });
  }
});
