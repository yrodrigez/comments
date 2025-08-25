type MaybePromise<T> = T | Promise<T>
type Unary<I, O> = (input: I) => MaybePromise<O>

export function pipe<I, O>(...fns: Unary<any, any>[]) {
    return async (input: I): Promise<O> => {
        let acc: any = input
        for (const fn of fns) {
            acc = await fn(acc)
        }
        return acc as O
    }
}
