document.addEventListener('DOMContentLoaded', () => {
  const enableFeatureCheckbox = document.getElementById('enableFeature');
  const maxLikesInput = document.getElementById('maxLikes');
  const saveButton = document.getElementById('saveButton');
  const savedMessage = document.getElementById('savedMessage');

  // Load the saved settings
  chrome.storage.sync.get(['enableFeature', 'maxLikes'], (result) => {
    if (result.enableFeature !== undefined) {
      enableFeatureCheckbox.checked = result.enableFeature;
    }
    if (result.maxLikes !== undefined) {
      maxLikesInput.value = result.maxLikes;
    }
  });

  // Save the settings
  saveButton.addEventListener('click', () => {
    const enableFeature = enableFeatureCheckbox.checked;
    const maxLikes = parseInt(maxLikesInput.value, 10);

    if (enableFeature && isNaN(maxLikes)) {
      // Show the error message if enableFeature is checked but maxLikes isn't set
      savedMessage.textContent = 'Please set the max likes threshold.';
      savedMessage.style.color = 'red';
      savedMessage.style.display = 'block';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 2000);
    } else {
      // Hide the error message if the condition is met
      savedMessage.style.display = 'none';

      // Save the settings
      chrome.storage.sync.set({ enableFeature, maxLikes }, () => {
        // Show the saved message
        savedMessage.textContent = 'Options saved!';
        savedMessage.style.color = 'green';
        savedMessage.style.display = 'block';
        // Hide the message after the animation ends
        setTimeout(() => {
          savedMessage.style.display = 'none';
        }, 2000);
      });
    }
  });
});