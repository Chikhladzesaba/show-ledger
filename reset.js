// Clear all: deletes ONLY Show Ledger's data (Media Kit data stays)
document.getElementById('clear-all')?.addEventListener('click', function () {
  const answer = prompt(
    'This deletes all your Show Ledger entries, channels and settings in this browser. It cannot be undone.\n\nType DELETE to confirm.'
  );
  if (answer !== 'DELETE') return;
  localStorage.removeItem('showLedgerV2');
  location.reload();
});
