import { useState, useCallback } from 'react';

/**
 * useAsync - manages async operation state
 * @param {Function} asyncFn - the async function to execute
 * @returns {{ execute, data, loading, error }}
 */
const useAsync = (asyncFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'An unexpected error occurred';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { execute, data, loading, error };
};

export default useAsync;
