// Function to simulate a mouse click on an element
function simulateClick(element) {
  if (!element) return;
  element.click();
}

function attemptToClickNotInterested(retries = 3, delay = 100, event) {
  setTimeout(() => {
    // Find all menu items within the dropdown
    const menuItems = document.querySelectorAll(
      'div[data-testid="Dropdown"] div[role="menuitem"]'
    );

    // Search for the menu item that includes 'not interested'
    const notInterestedButton = menuItems[0];

    if (notInterestedButton) {
      simulateClick(notInterestedButton);
      // Show an explosion GIF on click
      showExplosionGif(event);
    } else if (retries > 0) {
      attemptToClickNotInterested(retries - 1, delay, event);
    }
  }, delay);
}

function addNotInterestedListener(button, ellipsisButton) {
  // Add click event listener to the custom button
  button.addEventListener('click', (event) => {
    // Click the ellipsis button to open the menu
    simulateClick(ellipsisButton);

    // Start the attempt with defined retries and delay
    attemptToClickNotInterested(3, 100, event);
  });
}

function showExplosionGif(event) {
  const explosionGif = document.createElement('img');
  const gifUrl = chrome.runtime.getURL('assets/explosion.gif');

  gifXPos = event.clientX + window.scrollX - 500;
  gifYpos = event.clientY + window.scrollY - 100;

  explosionGif.src = gifUrl;
  explosionGif.style.position = 'absolute';
  explosionGif.style.left = `${gifXPos}px`;
  explosionGif.style.top = `${gifYpos}px`;
  explosionGif.style.pointerEvents = 'none';
  explosionGif.style.zIndex = 1000;
  explosionGif.style.width = '500px'; // Adjust size as needed
  explosionGif.style.height = '500px'; // Adjust size as needed

  document.body.appendChild(explosionGif);

  // Remove the GIF after it has played once
  setTimeout(() => {
    explosionGif.remove();
  }, 600); // Adjust the timeout to match the duration of the GIF
}

// Function to add the custom "Not Interested" (NI) button next to the ellipsis
function addNotInterestedButton(post) {
  // Prevent adding multiple buttons to the same post
  if (post.querySelector('.custom-ni-button')) return;

  // Check if the post contains a div with the specified classes (indicating this post is a reply)
  if (
    post.querySelector(
      'article > div > div > div:nth-child(1) > div > div > div'
    )
  ) {
    // Allow reposts to have the "Not Interested" button
    if (
      !post.querySelector(
        'article > div > div > div:nth-child(1) > div > div > div > div'
      )
    ) {
      return;
    }
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

  // Add a click event listener to the custom button
  addNotInterestedListener(niButton, ellipsisButton);
}

// Function to process all existing posts on the page
function processExistingPosts() {
  const posts = document.querySelectorAll('article[data-testid="tweet"]');
  posts.forEach((post) => addNotInterestedButton(post));

  chrome.storage.sync.get(['enableFeature', 'maxLikes'], (result) => {
    const enableFeature = result.enableFeature;
    const maxLikes = result.maxLikes;

    // Iterate over each post and select elements with an aria-label attribute
    posts.forEach((post) => {
      const likeButton = post.querySelector('button[data-testid="like"]');

      if (likeButton) {
        const ariaLabel = likeButton.getAttribute('aria-label');

        const match = ariaLabel.match(/^(\d+)\s/); // Match the number at the beginning of the aria-label

        if (match) {
          const numberOfLikes = parseInt(match[1], 10); // Parse the number as an integer

          if (numberOfLikes >= maxLikes && enableFeature) {
            // delete the post from the dom tree
            post.remove();
          }
        }
      }
    });
  });
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
  const tabList = document.querySelector('div[data-testid="ScrollSnap-List"]');
  if (!tabList) {
    return false;
  }

  // Get the first tab in the tab list
  const firstTab = tabList.querySelector('a[role="tab"]');
  if (!firstTab) {
    return false;
  }

  // Check if the first tab is currently selected
  return firstTab.getAttribute('aria-selected') === 'true';
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
  const observer = new MutationObserver(() => {
    if (isForYouPage()) {
      handleUI();
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
