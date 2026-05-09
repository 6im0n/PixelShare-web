export type SubmissionStatus = 'not-started' | 'in-progress' | 'submitted'

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  'submitted': 'Submitted',
}

export function useSharedLibraries() {
  const { list } = useLibraries()

  async function librariesSharedWithMe() {
    return list()
  }

  function statusFor(): SubmissionStatus {
    return 'not-started'
  }

  return { librariesSharedWithMe, statusFor }
}
