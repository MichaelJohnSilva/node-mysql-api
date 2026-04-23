export default function validateRequest(schema: any) {
    return (req: any, res: any, next: any) => {
        const options = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        };

        const { error, value } = schema.validate(req.body, options);

        if (error) {
            next(`Validation error: ${error.details.map((x: any) => x.message).join(', ')}`);
        } else {
            req.body = value;
            next();
        }
    };
}