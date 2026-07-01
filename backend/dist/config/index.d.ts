export declare const config: {
    readonly nodeEnv: string;
    readonly port: number;
    readonly corsOrigins: string[];
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
    };
    readonly admin: {
        readonly username: string;
        readonly password: string;
        readonly name: string;
        readonly id: "admin001";
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly max: number;
    };
    readonly isProduction: boolean;
    readonly isDevelopment: boolean;
};
//# sourceMappingURL=index.d.ts.map