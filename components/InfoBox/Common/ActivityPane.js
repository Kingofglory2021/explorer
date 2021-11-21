import classNames from 'classnames'
import { upperFirst } from 'lodash'
import debounce from 'lodash.debounce'
import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { useActivity } from '../../../data/activity'
import ActivityList from '../../Lists/ActivityList/ActivityList'
import PillNavbar from '../../Nav/PillNavbar'
import { Link } from 'react-router-i18n'
import SkeletonList from '../../Lists/SkeletonList'

const filtersByContext = {
  hotspot: {
    Beacons: ['poc_receipts_v1'],
    Data: ['state_channel_close_v1'],
    Consensus: ['consensus_group_v1'],
    Rewards: ['rewards_v1', 'rewards_v2', 'rewards_v3'],
    'All Activity': [],
  },
  account: {
    Payments: ['payment_v1', 'payment_v2'],
    Stakes: ['stake_validator_v1'],
    'Hotspot Transfers': ['transfer_hotspot_v1'],
    'Token Burns': ['token_burn_v1'],
    Rewards: ['rewards_v1', 'rewards_v2', 'rewards_v3'],
    'All Activity': [],
  },
  validator: {
    Heartbeats: ['validator_heartbeat_v1'],
    Rewards: ['rewards_v1', 'rewards_v2', 'rewards_v3'],
    Stakes: [
      'stake_validator_v1',
      'unstake_validator_v1',
      'transfer_validator_stake_v1',
    ],
    'All Activity': [],
  },
}

const defaultFilter = {
  hotspot: 'Beacons',
  validator: 'Heartbeats',
  account: 'Payments',
}

const ActivityContent = ({
  isLoadingInitial,
  isLoadingMore,
  error,
  setError,
  context,
  filter,
  address,
  transactions,
  fetchMore,
  hasMore,
}) => {
  if (isLoadingInitial || isLoadingMore || !transactions) {
    return <SkeletonList />
  }

  if (error) {
    console.log(error)
    return (
      <div className="bg-red-100">
        <span>{error.toString()}</span>
        <button className="" onClick={setError(null)}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <ActivityList
      title={`${upperFirst(context)} Activity (${filter})`}
      description={
        <div className="flex flex-col space-y-2">
          <div>
            All transactions that this {context} has participated in, filtered
            by the currently selected filter ({filter}).
          </div>
          <div>
            If you want to create an export of this activity for taxes or
            record-keeping purposes, you can use one of the community-developed
            tools to do so. You can browse them all{' '}
            <Link
              className="text-gray-800 font-bold hover:text-darkgray-800"
              to="/tools"
            >
              here
            </Link>
            .
          </div>
        </div>
      }
      context={context}
      address={address}
      transactions={transactions}
      isLoading={isLoadingInitial}
      isLoadingMore={isLoadingMore}
      fetchMore={fetchMore}
      hasMore={hasMore}
    />
  )
}

const ActivityPane = ({ context, address }) => {
  const scrollView = useRef()
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const [filter, setFilter] = useState(defaultFilter[context])

  const filters = filtersByContext[context]

  const {
    transactions,
    fetchMore,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    error,
    setError,
  } = useActivity(context, address, filters[filter])

  const setVisibility = useCallback(
    () =>
      debounce(
        (currentPos, prevPos) => {
          setIsVisible(prevPos > currentPos)
          setPrevScrollPos(currentPos)
        },
        100,
        { leading: true, trailing: true },
      ),
    [],
  )

  const handleScroll = useCallback(
    ({ target: { scrollTop: currentScrollPos } }) => {
      setVisibility(currentScrollPos, prevScrollPos)
    },
    [prevScrollPos, setVisibility],
  )

  useEffect(() => {
    const currentScrollView = scrollView.current

    currentScrollView?.addEventListener('scroll', handleScroll)

    return () => currentScrollView?.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleUpdateFilter = useCallback((filterName) => {
    setFilter(filterName)
    scrollView.current.scrollTo(0, 0)
  }, [])

  return (
    <div
      ref={scrollView}
      className={classNames('no-scrollbar', {
        'overflow-y-scroll': !isLoadingInitial,
        'overflow-y-hidden': isLoadingInitial,
      })}
    >
      <div
        className={classNames(
          'sticky top-0 transform-gpu transition-transform duration-300 ease-in-out z-20',
          { '-translate-y-16': !isVisible },
        )}
      >
        <PillNavbar
          navItems={Object.entries(filters).map(([key, value]) => ({
            key,
            value,
          }))}
          activeItem={filter}
          disabled={isLoadingInitial || isLoadingMore}
          onClick={handleUpdateFilter}
        />
      </div>
      <div className="grid grid-flow-row grid-cols-1">
        <ActivityContent
          transactions={transactions}
          fetchMore={fetchMore}
          hasMore={hasMore}
          setError={setError}
          error={error}
          address={address}
          context={context}
          filter={filter}
          isLoadingInitial={isLoadingInitial}
          isLoadingMore={isLoadingMore}
        />
      </div>
    </div>
  )
}

export default memo(ActivityPane)
