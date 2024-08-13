export class HttpError extends Error {
  public statusCode: number
  public response: any

  constructor(statusCode: number, message: string, response: any) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.response = response

    // Set the prototype explicitly to maintain correct instance type
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}
