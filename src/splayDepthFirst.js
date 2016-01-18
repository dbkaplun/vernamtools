module.exports = function splayDepthFirst (nodes) {
  return nodes.reduce((splayed, node) => (
    splayed.concat([node].concat(splayDepthFirst(node.children)))
  ), [])
}
