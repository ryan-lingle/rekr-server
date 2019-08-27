const {
  SchemaDirectiveVisitor,
  AuthenticationError
} = require("apollo-server-express");
const Jwt = require("./jwt");

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function (src, args, { token, id, DB, ...context }, info) {
      if (!Jwt.verify(token, id)) {
        throw new AuthenticationError("AUTH")
      } else {
        const user = await DB.user.findByPk(id);
        if (!user.emailVerified) {
          throw new AuthenticationError("UNCONFIRMED")
        } else {
          const result = await resolve.call(src, args, {id, DB, ...context}, info);
          return result;
        }
      }
    }
  }
}

module.exports = AuthDirective;
