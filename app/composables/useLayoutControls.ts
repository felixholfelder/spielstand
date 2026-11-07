export const useLayoutControls = () => {
    const meetingFetchError = useState<string>("layout:meetingFetchError", () => "");

    return { meetingFetchError };
};