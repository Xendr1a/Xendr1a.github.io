(function () {
  function apply() {
    var body = document.querySelector('.markdown-body');
    if (!body) return;
    var p = body.querySelector(':scope > p');
    if (!p || p.querySelector('.dropcap')) return;
    var node = p.firstChild;
    while (node && node.nodeType !== 3) node = node.nextSibling;
    if (!node) return;
    var text = node.nodeValue;
    var lead = text.match(/^\s*/)[0];
    var rest = text.slice(lead.length);
    if (rest.length < 2) return;
    var span = document.createElement('span');
    span.className = 'dropcap';
    span.textContent = rest.slice(0, 2);
    node.nodeValue = rest.slice(2);
    p.insertBefore(span, node);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
