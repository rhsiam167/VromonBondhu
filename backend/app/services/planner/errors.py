"""The one error the planner raises on purpose: bad planning inputs."""


class PlannerInputError(ValueError):
    """
    Raised when the planning inputs can't be planned, e.g. an unsupported
    starting city. `field` names the input, `message` is plain English that can
    be shown to the user (the API turns it into a 422 response).
    """

    def __init__(self, field: str, message: str):
        super().__init__(message)
        self.field = field
        self.message = message
