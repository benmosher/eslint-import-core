'use strict'

exports.captureDefault = function (node) {
  if (node.type !== 'ExpressionStatement') return false
  if (node.expression.type !== 'AssignmentExpression') return false
  if (node.expression.left.type !== 'MemberExpression') return false

  var memberExpr = node.expression.left

  if (memberExpr.object.type !== 'Identifier') return false

  // exports[something]
  if (memberExpr.object.name === 'exports') return true

  if (memberExpr.object.name !== 'module') return false
  if (memberExpr.property.type !== 'Identifier') return false

  // module.exports
  if (memberExpr.property.name === 'exports') return true

  return false
}
