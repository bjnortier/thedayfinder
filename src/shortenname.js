module.exports = function(name) {

  var trimmed = name && name.trim();
  if (!trimmed || !trimmed.length) {
    throw new Error('name should be a non-empty string');
  }

  if (trimmed.length === 1) {
    return trimmed;
  }

  var split = trimmed.split(/\s/);

  // Only a single name, like Madonna
  if (split.length === 1) {
    return split[0].substr(0,2);
  }

  // Multiple names - first characters form first & last name
  return split[0][0] + split[split.length-1][0];

};