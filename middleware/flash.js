function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function renderFlash(req, { e }) {
  const flash = req.session.flash;
  if (!flash) return '';
  delete req.session.flash;

  const classMap = {
    success: 'alert-success',
    danger: 'alert-danger',
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info',
  };
  const iconMap = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill',
  };

  const cls = classMap[flash.type] || 'alert-info';
  const icon = iconMap[flash.type] || 'bi-info-circle-fill';

  return (
    `<div class="alert ${cls} alert-dismissible fade show d-flex align-items-center" role="alert">` +
    `<i class="bi ${icon} me-2 flex-shrink-0"></i>` +
    `<div>${e(flash.message)}</div>` +
    `<button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Fermer"></button>` +
    `</div>`
  );
}

module.exports = { setFlash, renderFlash };
