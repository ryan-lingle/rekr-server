const {
  SchemaDirectiveVisitor,
  AuthenticationError
} = require("apollo-server-express");
const Jwt = require("./jwt");

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function (src, args, { token, id, ...context }, info) {
      if (Jwt.verify(token, id)) {
        const result = await resolve.call(src, args, {id, ...context}, info);
        return result;
      } else {
        throw new AuthenticationError("AUTH")
      }
    }
  }
}

module.exports = AuthDirective;
