export const emailRule = {
    required: "Email is required",
    pattern: {
        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: "Invalid email address"
    },
    maxLength: {
        value: 255,
        message: "Email cannot exceed 255 characters"
    }
}