export class TokenUtils {
  static toDecimal(amount: number, decimals: number) {
    return amount / 10 ** decimals;
  }
}
