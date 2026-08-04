// form.yml.erb tags each "Additional R bundle" <option> (except "None") with
// a custom data-compat-rstudio="0,1" attribute: a comma-separated list of the
// rstudio_module <option> index values it is compiled against (matching R
// version + toolchain). This is hand-rolled rather than relying on
// OnDemand's built-in data-option-for-* directives, since several attempts
// using that mechanism did not reliably filter options in practice.

function applyRBundleFilter() {
  var rstudioValue = $('select[name$="[rstudio_module]"]').val();

  $('select[name$="[r_bundle_module]"] option').each(function () {
    var compat = $(this).data('compatRstudio');
    if (compat === undefined) return; // "None" - always valid

    var ok = String(compat).split(',').indexOf(rstudioValue) !== -1;
    $(this).prop('hidden', !ok);
    $(this).prop('disabled', !ok);
  });
}

// re-filter whenever the RStudio Server module changes, and reset the
// bundle choice to "None" - a bundle valid for one module is not guaranteed
// valid for another
$(document).on('change', 'select[name$="[rstudio_module]"]', function () {
  applyRBundleFilter();
  $('select[name$="[r_bundle_module]"]').val('').trigger('change');
});

// apply the filter once for the default selection on initial page load,
// without resetting any prefilled bundle value
$(function () {
  applyRBundleFilter();
});
