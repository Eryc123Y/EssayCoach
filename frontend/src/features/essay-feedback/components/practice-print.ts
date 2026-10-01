/** Opens collapsed rubric exemplars for a print job and restores their prior state afterwards. */
export function expandPracticeExemplarsForPrint(root: ParentNode = document): () => void {
  const exemplars = Array.from(root.querySelectorAll<HTMLDetailsElement>('details.practice-exemplar'));
  const originalStates = exemplars.map((exemplar) => exemplar.open);

  exemplars.forEach((exemplar) => {
    exemplar.open = true;
  });

  return () => {
    exemplars.forEach((exemplar, index) => {
      exemplar.open = originalStates[index];
    });
  };
}
