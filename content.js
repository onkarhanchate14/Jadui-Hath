// Previous manifest.json and background.js remain the same

// content.js with added scroll-to-undo feature
(function () {
  // Store for removed elements with their parent and next sibling info
  const removedElements = [];

  // Check if the selector is already active
  if (window._elementRemoverActive) {
    deactivateSelector();
    return;
  }

  // Activate the selector
  activateSelector();

  function activateSelector() {
    window._elementRemoverActive = true;

    // Add highlighting styles with overlay
    const style = document.createElement("style");
    style.id = "element-remover-style";
    style.textContent = `
        .element-remover-highlight {
          outline: 2px dashed red !important;
          outline-offset: -2px !important;
          cursor: pointer !important;
          position: relative !important;
        }
        
        .element-remover-highlight::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(255, 0, 0, 0.2) !important;
          pointer-events: none !important;
          z-index: 10000 !important;
        }
        
        @keyframes element-restore-highlight {
          0% { outline-color: rgba(255, 215, 0, 1); }
          100% { outline-color: rgba(255, 215, 0, 0); }
        }
        
        .element-restore-highlight {
          outline: 2px solid rgba(255, 215, 0, 1) !important;
          outline-offset: -2px !important;
          animation: element-restore-highlight 1.5s ease-out forwards;
        }
      `;
    document.head.appendChild(style);

    // Add event listeners with capture phase
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("mousedown", preventDefault, true);
    document.addEventListener("mouseup", preventDefault, true);
    document.addEventListener("focus", preventDefault, true);
    document.addEventListener("contextmenu", handleRightClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    // Add undo keyboard shortcut listener
    document.addEventListener("keydown", handleUndo, false);

    // Prevent all possible events that might trigger unwanted actions
    ["click", "mousedown", "mouseup", "focus"].forEach((eventType) => {
      document.addEventListener(eventType, stopAllEvents, true);
    });

    // Change cursor to indicate active state
    document.body.style.cursor = "crosshair";
  }

  function deactivateSelector() {
    window._elementRemoverActive = false;

    // Remove highlighting styles
    const style = document.getElementById("element-remover-style");
    if (style) style.remove();

    // Remove event listeners
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("mousedown", preventDefault, true);
    document.removeEventListener("mouseup", preventDefault, true);
    document.removeEventListener("focus", preventDefault, true);
    document.removeEventListener("contextmenu", handleRightClick, true);
    document.removeEventListener("keydown", handleKeyDown, true);
    document.removeEventListener("keydown", handleUndo, false);

    // Remove the additional event preventions
    ["click", "mousedown", "mouseup", "focus"].forEach((eventType) => {
      document.removeEventListener(eventType, stopAllEvents, true);
    });

    // Reset cursor
    document.body.style.cursor = "default";
  }

  function scrollToElement(element) {
    // Get element's position relative to the viewport
    const rect = element.getBoundingClientRect();
    const absoluteTop = window.pageYOffset + rect.top;

    // Calculate the target scroll position (slightly above the element)
    const padding = 100; // pixels above the element
    const scrollTarget = absoluteTop - padding;

    // Smooth scroll to the element
    window.scrollTo({
      top: scrollTarget,
      behavior: "smooth",
    });

    // Add temporary highlight effect
    element.classList.add("element-restore-highlight");
    setTimeout(() => {
      element.classList.remove("element-restore-highlight");
    }, 1500);
  }

  function stopAllEvents(e) {
    if (!window._elementRemoverActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }

  function preventDefault(e) {
    if (!window._elementRemoverActive) return;
    e.preventDefault();
  }

  function handleMouseOver(e) {
    if (!window._elementRemoverActive) return;
    stopAllEvents(e);
    e.target.classList.add("element-remover-highlight");
  }

  function handleMouseOut(e) {
    if (!window._elementRemoverActive) return;
    stopAllEvents(e);
    e.target.classList.remove("element-remover-highlight");
  }

  function handleClick(e) {
    if (!window._elementRemoverActive) return;
    stopAllEvents(e);

    // Store element info before removal
    const elementInfo = {
      element: e.target,
      parent: e.target.parentNode,
      nextSibling: e.target.nextSibling,
    };
    removedElements.push(elementInfo);

    // Remove the element
    e.target.remove();
  }

  function handleRightClick(e) {
    if (!window._elementRemoverActive) return;
    stopAllEvents(e);
    deactivateSelector();
  }

  function handleKeyDown(e) {
    if (!window._elementRemoverActive) return;
    if (e.key === "Escape") {
      stopAllEvents(e);
      deactivateSelector();
    }
  }

  function handleUndo(e) {
    // Check for Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "z") {
      if (window._elementRemoverActive) {
        stopAllEvents(e);
      }

      const lastRemoved = removedElements.pop();
      if (lastRemoved) {
        if (lastRemoved.nextSibling) {
          lastRemoved.parent.insertBefore(
            lastRemoved.element,
            lastRemoved.nextSibling
          );
        } else {
          lastRemoved.parent.appendChild(lastRemoved.element);
        }

        // Scroll to the restored element
        scrollToElement(lastRemoved.element);
      }
    }
  }
})();
