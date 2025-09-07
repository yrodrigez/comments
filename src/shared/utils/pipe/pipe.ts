type MaybePromise<T> = T | Promise<T>
type Unary<I, O> = (input: I) => MaybePromise<O>

// Enhanced pipe function with better type inference
export function pipe<A, B>(fn1: Unary<A, B>): Unary<A, B>
export function pipe<A, B, C>(fn1: Unary<A, B>, fn2: Unary<B, C>): Unary<A, C>
export function pipe<A, B, C, D>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>): Unary<A, D>
export function pipe<A, B, C, D, E>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>, fn4: Unary<D, E>): Unary<A, E>
export function pipe<A, B, C, D, E, F>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>, fn4: Unary<D, E>, fn5: Unary<E, F>): Unary<A, F>
export function pipe<A, B, C, D, E, F, G>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>, fn4: Unary<D, E>, fn5: Unary<E, F>, fn6: Unary<F, G>): Unary<A, G>
export function pipe<A, B, C, D, E, F, G, H>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>, fn4: Unary<D, E>, fn5: Unary<E, F>, fn6: Unary<F, G>, fn7: Unary<G, H>): Unary<A, H>
export function pipe<A, B, C, D, E, F, G, H, I>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>, fn4: Unary<D, E>, fn5: Unary<E, F>, fn6: Unary<F, G>, fn7: Unary<G, H>, fn8: Unary<H, I>): Unary<A, I>
export function pipe<A, B, C, D, E, F, G, H, I, J>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>, fn4: Unary<D, E>, fn5: Unary<E, F>, fn6: Unary<F, G>, fn7: Unary<G, H>, fn8: Unary<H, I>, fn9: Unary<I, J>): Unary<A, J>
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(fn1: Unary<A, B>, fn2: Unary<B, C>, fn3: Unary<C, D>, fn4: Unary<D, E>, fn5: Unary<E, F>, fn6: Unary<F, G>, fn7: Unary<G, H>, fn8: Unary<H, I>, fn9: Unary<I, J>, fn10: Unary<J, K>): Unary<A, K>
export function pipe(...fns: Unary<any, any>[]): Unary<any, any>

export function pipe<I, O>(...fns: Unary<any, any>[]) {
    return async (input: I): Promise<O> => {
        let acc: any = input
        for (const fn of fns) {
            acc = await fn(acc)
        }
        return acc as O
    }
}
