import { Trash2 } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useDeleteEnvironmentsMutation } from '@/react/portainer/environments/queries/useDeleteEnvironmentsMutation';

import { Datatable as GenericDatatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { confirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';
import { ModalType } from '@@/modals';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { useAssociateDeviceMutation, useLicenseOverused } from '../queries';

import { columns } from './columns';
import { Filter } from './Filter';
import { useEnvironments } from './useEnvironments';

const storageKey = 'edge-devices-waiting-room';

const settingsStore = createPersistedStore(storageKey, 'Name');

export function Datatable() {
  const associateMutation = useAssociateDeviceMutation();
  const removeMutation = useDeleteEnvironmentsMutation();
  const { willExceed } = useLicenseOverused();
  const tableState = useTableState(settingsStore, storageKey);
  const { data: environments, totalCount, isLoading } = useEnvironments();

  return (
    <GenericDatatable
      settingsManager={tableState}
      columns={columns}
      dataset={environments}
      title="Edge Devices Waiting Room"
      emptyContentLabel="No Edge Devices found"
      renderTableActions={(selectedRows) => (
        <>
          <Button
            onClick={() => handleRemoveDevice(selectedRows)}
            disabled={selectedRows.length === 0}
            color="dangerlight"
            icon={Trash2}
          >
            Remove Device
          </Button>

          <TooltipWithChildren
            message={
              willExceed(selectedRows.length) && (
                <>
                  Associating devices is disabled as your node count exceeds
                  your license limit
                </>
              )
            }
          >
            <span>
              <Button
                onClick={() => handleAssociateDevice(selectedRows)}
                disabled={
                  selectedRows.length === 0 || willExceed(selectedRows.length)
                }
              >
                Associate Device
              </Button>
            </span>
          </TooltipWithChildren>
        </>
      )}
      isLoading={isLoading}
      totalCount={totalCount}
      description={<Filter />}
    />
  );

  function handleAssociateDevice(devices: Environment[]) {
    associateMutation.mutate(
      devices.map((d) => d.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Edge devices associated successfully');
        },
      }
    );
  }

  async function handleRemoveDevice(devices: Environment[]) {
    const confirmed = await confirm({
      title: 'Are you sure?',
      message:
        "You're about to remove edge device(s) from waiting room, which will not be shown until next agent startup.",
      confirmButton: buildConfirmButton('Remove', 'danger'),
      modalType: ModalType.Destructive,
    });

    if (!confirmed) {
      return;
    }

    removeMutation.mutate(
      devices.map((d) => d.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Edge devices were hidden successfully');
        },
      }
    );
  }
}
