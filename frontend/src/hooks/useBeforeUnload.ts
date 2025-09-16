import { useEffect } from 'react';

/**
 * Custom hook to show a confirmation dialog when the user tries to leave the page
 * @param {boolean} isDirty - Whether there are unsaved changes
 * @param {string} [message] - Custom message to show in the confirmation dialog
 */
const useBeforeUnload = (isDirty: boolean, message = 'You have unsaved changes. Are you sure you want to leave?') => {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent): string | void => {
      e.preventDefault();
      // For modern browsers
      e.returnValue = message;
      // For older browsers
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);
};

export default useBeforeUnload;
