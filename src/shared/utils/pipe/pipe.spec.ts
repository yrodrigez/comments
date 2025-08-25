import { pipe } from './pipe';

describe('pipe utility', () => {
    describe('synchronous functions', () => {
        it('should pipe a single function', async () => {
            const addOne = (x: number) => x + 1;
            const piped = pipe(addOne);

            const result = await piped(5);
            expect(result).toBe(6);
        });

        it('should pipe multiple synchronous functions', async () => {
            const addOne = (x: number) => x + 1;
            const multiplyByTwo = (x: number) => x * 2;
            const subtract3 = (x: number) => x - 3;

            const piped = pipe(addOne, multiplyByTwo, subtract3);

            const result = await piped(5);
            // (5 + 1) * 2 - 3 = 12 - 3 = 9
            expect(result).toBe(9);
        });

        it('should handle string transformations', async () => {
            const toUpperCase = (str: string) => str.toUpperCase();
            const addPrefix = (str: string) => `PREFIX_${str}`;
            const addSuffix = (str: string) => `${str}_SUFFIX`;

            const piped = pipe(toUpperCase, addPrefix, addSuffix);

            const result = await piped('hello');
            expect(result).toBe('PREFIX_HELLO_SUFFIX');
        });

        it('should handle object transformations', async () => {
            interface User {
                name: string;
                age?: number;
                email?: string;
            }

            const addAge = (user: User) => ({ ...user, age: 25 });
            const addEmail = (user: User) => ({ ...user, email: 'test@example.com' });
            const formatName = (user: User) => ({ ...user, name: user.name.toUpperCase() });

            const piped = pipe(addAge, addEmail, formatName);

            const result = await piped({ name: 'john' });
            expect(result).toEqual({
                name: 'JOHN',
                age: 25,
                email: 'test@example.com'
            });
        });
    });

    describe('asynchronous functions', () => {
        it('should pipe a single async function', async () => {
            const addOneAsync = async (x: number) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return x + 1;
            };

            const piped = pipe(addOneAsync);

            const result = await piped(5);
            expect(result).toBe(6);
        });

        it('should pipe multiple async functions', async () => {
            const addOneAsync = async (x: number) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return x + 1;
            };

            const multiplyByTwoAsync = async (x: number) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return x * 2;
            };

            const piped = pipe(addOneAsync, multiplyByTwoAsync);

            const result = await piped(5);
            // (5 + 1) * 2 = 12
            expect(result).toBe(12);
        });

        it('should handle async API-like operations', async () => {
            interface ApiResponse {
                data: any;
                status: number;
            }

            const fetchData = async (url: string): Promise<ApiResponse> => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return {
                    data: { message: `Data from ${url}` },
                    status: 200
                };
            };

            const extractData = async (response: ApiResponse) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                return response.data;
            };

            const formatMessage = async (data: any) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                return data.message.toUpperCase();
            };

            const piped = pipe(fetchData, extractData, formatMessage);

            const result = await piped('/api/test');
            expect(result).toBe('DATA FROM /API/TEST');
        });
    });

    describe('mixed sync and async functions', () => {
        it('should handle sync and async functions mixed together', async () => {
            const addOne = (x: number) => x + 1;
            const multiplyByTwoAsync = async (x: number) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return x * 2;
            };
            const subtract3 = (x: number) => x - 3;

            const piped = pipe(addOne, multiplyByTwoAsync, subtract3);

            const result = await piped(5);
            // (5 + 1) * 2 - 3 = 12 - 3 = 9
            expect(result).toBe(9);
        });

        it('should handle async first then sync', async () => {
            const addOneAsync = async (x: number) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return x + 1;
            };
            const multiplyByTwo = (x: number) => x * 2;

            const piped = pipe(addOneAsync, multiplyByTwo);

            const result = await piped(5);
            expect(result).toBe(12);
        });
    });

    describe('edge cases', () => {
        it('should handle empty pipeline', async () => {
            const piped = pipe();

            const result = await piped(42);
            expect(result).toBe(42);
        });

        it('should handle null and undefined values', async () => {
            const returnNull = () => null;
            const handleNull = (x: any) => x === null ? 'was null' : x;

            const piped = pipe(returnNull, handleNull);

            const result = await piped('input');
            expect(result).toBe('was null');
        });

        it('should handle undefined input', async () => {
            const handleUndefined = (x: any) => x === undefined ? 'was undefined' : x;
            const addSuffix = (x: string) => `${x}_processed`;

            const piped = pipe(handleUndefined, addSuffix);

            const result = await piped(undefined);
            expect(result).toBe('was undefined_processed');
        });

        it('should handle boolean transformations', async () => {
            const negate = (x: boolean) => !x;
            const toString = (x: boolean) => x.toString();
            const toUpperCase = (x: string) => x.toUpperCase();

            const piped = pipe(negate, toString, toUpperCase);

            const result = await piped(true);
            expect(result).toBe('FALSE');
        });
    });

    describe('error handling', () => {
        it('should propagate sync function errors', async () => {
            const throwError = () => {
                throw new Error('Sync error');
            };
            const addOne = (x: number) => x + 1;

            const piped = pipe(addOne, throwError);

            await expect(piped(5)).rejects.toThrow('Sync error');
        });

        it('should propagate async function errors', async () => {
            const throwErrorAsync = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                throw new Error('Async error');
            };
            const addOne = (x: number) => x + 1;

            const piped = pipe(addOne, throwErrorAsync);

            await expect(piped(5)).rejects.toThrow('Async error');
        });

        it('should stop execution on first error', async () => {
            const addOne = (x: number) => x + 1;
            const throwError = () => {
                throw new Error('Pipeline error');
            };
            const multiplyByTwo = jest.fn((x: number) => x * 2);

            const piped = pipe(addOne, throwError, multiplyByTwo);

            await expect(piped(5)).rejects.toThrow('Pipeline error');
            expect(multiplyByTwo).not.toHaveBeenCalled();
        });
    });

    describe('type transformations', () => {
        it('should handle type transformations through the pipeline', async () => {
            const numberToString = (x: number) => x.toString();
            const stringToArray = (x: string) => x.split('');
            const arrayLength = (x: string[]) => x.length;

            const piped = pipe(numberToString, stringToArray, arrayLength);

            const result = await piped(12345);
            expect(result).toBe(5);
        });

        it('should handle complex object transformations', async () => {
            interface Input {
                values: number[];
            }

            interface ProcessedData {
                sum: number;
                count: number;
            }

            interface Output {
                average: number;
                message: string;
            }

            const calculateStats = (input: Input): ProcessedData => ({
                sum: input.values.reduce((a, b) => a + b, 0),
                count: input.values.length
            });

            const formatOutput = async (data: ProcessedData): Promise<Output> => {
                await new Promise(resolve => setTimeout(resolve, 5));
                const average = data.sum / data.count;
                return {
                    average,
                    message: `Average of ${data.count} numbers is ${average}`
                };
            };

            const piped = pipe(calculateStats, formatOutput);

            const result = await piped({ values: [1, 2, 3, 4, 5] });
            expect(result).toEqual({
                average: 3,
                message: 'Average of 5 numbers is 3'
            });
        });
    });

    describe('real-world usage patterns', () => {
        it('should handle data validation and transformation pipeline', async () => {
            interface RawUser {
                name: string;
                email: string;
                age: string;
            }

            interface ValidatedUser {
                name: string;
                email: string;
                age: number;
            }

            interface ProcessedUser extends ValidatedUser {
                id: string;
                createdAt: Date;
            }

            const validateUser = (user: RawUser): ValidatedUser => {
                if (!user.name || !user.email) {
                    throw new Error('Name and email are required');
                }
                const age = parseInt(user.age);
                if (isNaN(age) || age < 0) {
                    throw new Error('Valid age is required');
                }
                return {
                    name: user.name.trim(),
                    email: user.email.toLowerCase().trim(),
                    age
                };
            };

            const enrichUser = async (user: ValidatedUser): Promise<ProcessedUser> => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return {
                    ...user,
                    id: `user_${Date.now()}`,
                    createdAt: new Date()
                };
            };

            const piped = pipe<RawUser, ProcessedUser>(validateUser, enrichUser);

            const result = await piped({
                name: '  John Doe  ',
                email: '  JOHN@EXAMPLE.COM  ',
                age: '25'
            });

            expect(result.name).toBe('John Doe');
            expect(result.email).toBe('john@example.com');
            expect(result.age).toBe(25);
            expect(result.id).toMatch(/^user_\d+$/);
            expect(result.createdAt).toBeInstanceOf(Date);
        });
    });
});
