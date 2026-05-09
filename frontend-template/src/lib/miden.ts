/** Generate a random 4-felt Word (used as note serial number). */
export async function randomWord() {
  const { Felt, Word } = await import("@miden-sdk/miden-sdk");
  const felts = Array.from({ length: 4 }, () =>
    new Felt(BigInt(Math.floor(Math.random() * 2 ** 32))),
  );
  return Word.newFromFelts(felts);
}
