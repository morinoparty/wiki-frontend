"use client";

import {
  createToaster,
  Toaster as ChlorophyllToaster,
  type ToastOptions,
} from "@morinoparty/chlorophyll-react/components";

// Chakra 版と同じ zag の toast store をそのまま使うため、
// toaster.error / success / promise といった呼び出し側の API は変わらない。
export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
});

// 既存の呼び出し側は closable を `meta: { closable: true }` で渡している。
// chlorophyll(Ark 標準)は `closable` を直接見るため、ここで両方を受ける。
const isClosable = (toast: ToastOptions) =>
  Boolean(toast.closable ?? toast.meta?.closable);

export const Toaster = () => {
  return (
    <ChlorophyllToaster toaster={toaster}>
      {(toast) => (
        <ChlorophyllToaster.Toast>
          <ChlorophyllToaster.Indicator type={toast.type} />
          <ChlorophyllToaster.Content>
            {toast.title ? (
              <ChlorophyllToaster.Title>{toast.title}</ChlorophyllToaster.Title>
            ) : null}
            {toast.description ? (
              <ChlorophyllToaster.Description>
                {toast.description}
              </ChlorophyllToaster.Description>
            ) : null}
          </ChlorophyllToaster.Content>
          {toast.action ? (
            <ChlorophyllToaster.ActionTrigger>
              {toast.action.label}
            </ChlorophyllToaster.ActionTrigger>
          ) : null}
          {isClosable(toast) ? <ChlorophyllToaster.CloseTrigger /> : null}
        </ChlorophyllToaster.Toast>
      )}
    </ChlorophyllToaster>
  );
};
