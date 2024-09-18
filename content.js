// Function to simulate a mouse click on an element
function simulateClick(element) {
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.click();
}

// Function to add the custom "Not Interested" (NI) button next to the ellipsis
function addNotInterestedButton(post) {
  // Prevent adding multiple buttons to the same post
  if (post.querySelector('.custom-ni-button')) return;

  // Check if the post contains a div with the specified classes
  if (
    post.querySelector(
      'div.css-175oi2r.r-1bnu78o.r-f8sm7e.r-m5arl1.r-1p0dtai.r-1d2f490.r-u8s1d.r-zchlnj.r-ipm5af'
    )
  ) {
    return;
  }

  // Find the ellipsis (caret) button within the post
  const ellipsisButton = post.querySelector('button[data-testid="caret"]');
  if (!ellipsisButton) {
    return;
  }

  // Create the custom "NI" button
  const niButton = document.createElement('button');
  niButton.innerText = '🛑'; // You can change this text or add an icon
  niButton.style.marginRight = '8px';
  niButton.style.fontSize = '12px'; // Increased size for better visibility
  niButton.style.backgroundColor = 'transparent';
  niButton.style.border = 'none';
  niButton.style.padding = '4px 8px';
  niButton.style.cursor = 'pointer';
  niButton.style.color = '#ff6b6b'; // Changed color to red for emphasis
  niButton.classList.add('custom-ni-button');

  // Insert the button before the ellipsis button
  ellipsisButton.parentNode.insertBefore(niButton, ellipsisButton);

  // Add click event listener to the custom button
  niButton.addEventListener('click', () => {
    // Click the ellipsis button to open the menu
    simulateClick(ellipsisButton);

    // Function to attempt finding and clicking the "Not Interested" option
    function attemptToClickNotInterested(retries = 3, delay = 100) {
      setTimeout(() => {
        // Find all menu items within the dropdown
        const menuItems = document.querySelectorAll(
          'div[data-testid="Dropdown"] div[role="menuitem"]'
        );

        // Search for the menu item that includes 'not interested'
        const notInterestedButton = Array.from(menuItems).find((item) => {
          const text = item.innerText.trim().toLowerCase();
          return text.includes('not interested');
        });

        if (notInterestedButton) {
          simulateClick(notInterestedButton);
        } else if (retries > 0) {
          attemptToClickNotInterested(retries - 1, delay);
        } else {
        }
      }, delay);
    }

    // Start the attempt with defined retries and delay
    attemptToClickNotInterested();
  });
}

// Function to process all existing posts on the page
function processExistingPosts() {
  const posts = document.querySelectorAll('article[data-testid="tweet"]');
  posts.forEach((post) => addNotInterestedButton(post));
}

// Function to remove all "❌" buttons from the page
function removeAllNIButtons() {
  const buttons = document.querySelectorAll('.custom-ni-button');
  buttons.forEach((button) => button.remove());
}

function isForYouPage() {
  const path = window.location.pathname;
  if (path !== '/home' && path !== '/') {
    return false;
  }

  // Select the top bar's tablist
  const tabList = document.querySelector('div[role="tablist"]');
  if (!tabList) {
    return false;
  }

  // Find the "For you" tab using its accessible name
  const forYouTab = Array.from(tabList.querySelectorAll('a[role="tab"]')).find(
    (tab) => {
      const span = tab.querySelector('span');
      return span && span.innerText.toLowerCase().includes('for you');
    }
  );

  if (!forYouTab) {
    return false;
  }

  // Check if the "For you" tab is currently selected
  return forYouTab.getAttribute('aria-selected') === 'true';
}

// Function to handle UI based on the current URL
function handleUI() {
  if (isForYouPage()) {
    // If on /home, add buttons
    processExistingPosts();
  } else {
    // If not on /home, remove any existing buttons
    removeAllNIButtons();
  }
}

// Function to detect URL changes in an SPA
function onLocationChanged(callback) {
  const oldPushState = history.pushState;
  const oldReplaceState = history.replaceState;

  history.pushState = function (...args) {
    oldPushState.apply(this, args);
    window.dispatchEvent(new Event('locationchange'));
  };

  history.replaceState = function (...args) {
    oldReplaceState.apply(this, args);
    window.dispatchEvent(new Event('locationchange'));
  };

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'));
  });

  window.addEventListener('locationchange', callback);
}

// Initialize the script
function init() {
  handleUI();

  // Listen for URL changes
  onLocationChanged(handleUI);

  // Observe DOM changes to handle dynamically loaded content on /home
  const observer = new MutationObserver((mutations) => {
    if (isForYouPage()) {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            node.matches('article[data-testid="tweet"]')
          ) {
            addNotInterestedButton(node);
          } else if (node.nodeType === 1) {
            const nestedPosts = node.querySelectorAll(
              'article[data-testid="tweet"]'
            );
            nestedPosts.forEach((post) => addNotInterestedButton(post));
          }
        });
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Run the initializer when DOM is ready
setTimeout(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}, 3000);
