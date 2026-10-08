export interface UserProps {
    name: string;
    email: string;
    clientCode: string;
    role: "client" | "admin";
}
