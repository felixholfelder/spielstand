export interface SnackbarState {
    visible: boolean;
    message: string;
    color: "error" | "success" | "warning" | "info";
    timeout: number;
}

export function useSnackbar() {
    const state = useState<SnackbarState>("snackbar", () => ({
        visible: false,
        message: "",
        color: "error",
        timeout: 5000,
    }));

    function show(
        message: string,
        color: SnackbarState["color"] = "error",
        timeout = 5000,
    ) {
        state.value = { visible: true, message, color, timeout };
    }

    function showError(message = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.") {
        show(message, "error");
    }

    function hide() {
        state.value.visible = false;
    }

    return { state, show, showError, hide };
}