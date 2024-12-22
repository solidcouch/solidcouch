export class HttpError extends Error {
  public status: number
  public response: Response

  constructor(message: string, response: Response) {
    super(message)
    this.name = 'HttpError'
    this.status = response.status
    this.response = response

    // Set the prototype explicitly to maintain correct instance type
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}
