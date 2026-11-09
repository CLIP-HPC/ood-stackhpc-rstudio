// form.yml.erb tags each "Additional R bundle" <option> (except "None") with
// a custom data-compat-rstudio="A,B" attribute: a comma-separated list of the
// rstudio_module <option> values (module names) it is compiled against
// (matching R version + toolchain). This is hand-rolled rather than relying on
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

// form.yml.erb tags memory <option>s that only some partitions can satisfy
// with data-only-partition="m"; hide them for any other partition, and if
// the current choice gets hidden, fall back to the largest size still shown
function applyRamFilter() {
  var partition = $('select[name$="[partition]"]').val();
  var $ram = $('select[name$="[ram]"]');

  $ram.find('option').each(function () {
    var only = $(this).data('onlyPartition');
    if (only === undefined) return; // available on every partition

    var ok = String(only).split(',').indexOf(partition) !== -1;
    $(this).prop('hidden', !ok);
    $(this).prop('disabled', !ok);
  });

  if ($ram.find('option:selected').prop('disabled')) {
    $ram.val($ram.find('option:not(:disabled)').last().val()).trigger('change');
  }
}

$(document).on('change', 'select[name$="[partition]"]', applyRamFilter);
$(applyRamFilter);

// the GPU type field only applies to the g partition; hide it otherwise
// (submit.yml.erb ignores its value for other partitions). OnDemand 4 wraps
// each field in "#<field id>_wrapper" and hides with Bootstrap's d-none, the
// same way its own dynamic_forms.js toggleItemVisible() does
function applyGpuTypeVisibility() {
  var isGpu = $('select[name$="[partition]"]').val() === 'g';
  var $gpuType = $('select[name$="[gpu_type]"]');
  $('#' + $gpuType.attr('id') + '_wrapper').toggleClass('d-none', !isGpu);
}

$(document).on('change', 'select[name$="[partition]"]', applyGpuTypeVisibility);
$(applyGpuTypeVisibility);
