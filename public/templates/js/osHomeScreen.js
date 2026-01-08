document.addEventListener("DOMContentLoaded", (e) => {
  const appsContainer = document.querySelector(".apps");
  const apps = appsContainer ? appsContainer.querySelectorAll(".app") : [];
  const gamehkengineApp = document.querySelector("#app-gamehkengine");

  // double-click pour ouvrir le jeu dans un nouvel onglet
  if (gamehkengineApp)
    if (Login._isLoggedIn())
      gamehkengineApp.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        window.open("/lien-vers-le-jeu", "_blank");
      });

  if (!appsContainer) {
    return;
  }

  for (const app of apps) {
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let dragHappened = false;
    let startX = 0;
    let startY = 0;
    let wrapper = null;
    let containerRect = null;

    function onMouseMove(e) {
      const distance =
        Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);

      if (distance > 5) {
        dragHappened = true;

        if (!isDragging) {
          isDragging = true;
          wrapper = app.closest("a") || app;
          containerRect = appsContainer.getBoundingClientRect();

          const rect = wrapper.getBoundingClientRect();
          offsetX = e.clientX - rect.left;
          offsetY = e.clientY - rect.top;

          wrapper.classList.add("dragging");
          wrapper.style.position = "absolute";
          wrapper.style.width = `${rect.width}px`;
          wrapper.style.height = `${rect.height}px`;
          wrapper.style.left = `${rect.left - containerRect.left}px`;
          wrapper.style.top = `${rect.top - containerRect.top}px`;
          wrapper.style.zIndex = "1000";
        }

        if (!wrapper || !containerRect) return;

        wrapper.style.left = `${e.clientX - containerRect.left - offsetX}px`;
        wrapper.style.top = `${e.clientY - containerRect.top - offsetY}px`;
      }
    }

    function onMouseUp(e) {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (isDragging && dragHappened && wrapper) {
        snapToGrid(e, appsContainer, wrapper);
      }

      resetDraggingStyles(wrapper);

      isDragging = false;

      // Keep the "drag happened" flag long enough to swallow the click event
      setTimeout(() => {
        dragHappened = false;
      }, 0);
    }

    app.addEventListener("mousedown", (e) => {
      e.preventDefault();

      wrapper = app.closest("a") || app;
      containerRect = appsContainer.getBoundingClientRect();

      const rect = wrapper.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      startX = e.clientX;
      startY = e.clientY;
      dragHappened = false;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    const cancelClickIfDragged = (e) => {
      if (dragHappened || isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (app.parentElement) {
      app.parentElement.addEventListener("click", cancelClickIfDragged);
    }
    app.addEventListener("click", cancelClickIfDragged);
  }
});

function resetDraggingStyles(node) {
  if (!node) return;

  node.classList.remove("dragging");
  node.style.position = "";
  node.style.left = "";
  node.style.top = "";
  node.style.width = "";
  node.style.height = "";
  node.style.zIndex = "";
}

function snapToGrid(event, container, item) {
  const containerRect = container.getBoundingClientRect();
  const style = window.getComputedStyle(container);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const columnGap = parseFloat(style.columnGap) || 0;
  const rowGap = parseFloat(style.rowGap) || 0;

  const siblings = Array.from(container.children).filter(
    (child) => child !== item
  );
  const reference = siblings[0] || item;
  const refRect = reference.getBoundingClientRect();

  const cellWidth = refRect.width + columnGap;
  const cellHeight = refRect.height + rowGap;

  if (cellWidth <= 0 || cellHeight <= 0) return;

  const columns = Math.max(
    1,
    Math.floor((containerRect.width + columnGap) / cellWidth)
  );

  const col = Math.max(
    0,
    Math.floor((event.clientX - containerRect.left - paddingLeft) / cellWidth)
  );
  const row = Math.max(
    0,
    Math.floor((event.clientY - containerRect.top - paddingTop) / cellHeight)
  );

  let targetIndex = row * columns + col;
  targetIndex = Math.min(siblings.length, targetIndex);

  const beforeNode = siblings[targetIndex] || null;
  container.insertBefore(item, beforeNode);
}
